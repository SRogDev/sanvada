"""QLoRA fine-tuning entry point (Phase 12, PLAN §40).

Runs ONLY on a GPU worker (RunPod / Vast.ai). In this environment it
refuses to start with a clear, actionable error instead of a confusing
ImportError.

Recipe: Unsloth + bnb 4-bit + LoRA r=16/alpha=32 on all-linear targets,
lr 2e-4, 2 epochs, effective batch 16 (2x8 accumulation), warmup 3%,
cosine, adamw_8bit, seed 7, max_seq_length 4096, early stopping on best
val loss.

Masking: DataCollatorForCompletionOnlyLM on "### Response\\n" — loss is
computed ONLY on the assistant tokens (labels != -100 elsewhere is a
silent correctness bug: the model learns to parrot the prompt).
"""

from __future__ import annotations

import argparse
import importlib.util
import shutil


def check_environment() -> None:
    """Fail fast with guidance when the training deps/GPU are absent."""
    missing = [
        mod
        for mod in ("torch", "unsloth", "transformers", "datasets", "trl")
        if importlib.util.find_spec(mod) is None
    ]
    no_cuda = importlib.util.find_spec("torch") is None or not _cuda_available()
    problems = []
    if missing:
        problems.append(f"missing packages: {', '.join(missing)}")
    if no_cuda:
        problems.append("no CUDA GPU detected")
    if problems:
        raise RuntimeError(
            "Training must run on a GPU worker (RunPod / Vast.ai). "
            + "; ".join(problems)
            + ". Install with: uv sync --extra train (on the worker)."
        )


def _cuda_available() -> bool:
    try:
        import torch

        return torch.cuda.is_available()
    except Exception:
        return False


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="QLoRA fine-tune the selection model")
    parser.add_argument("--base-model", default="Qwen/Qwen3-4B-Instruct-2507")
    parser.add_argument("--train-data", required=True)
    parser.add_argument("--val-data", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--r", type=int, default=16)
    parser.add_argument("--alpha", type=int, default=32)
    parser.add_argument("--lr", type=float, default=2e-4)
    parser.add_argument("--epochs", type=int, default=2)
    parser.add_argument("--seed", type=int, default=7)
    return parser.parse_args(argv)


RESPONSE_TEMPLATE = "### Response\n"


def build_training_text(example: dict) -> str:
    """Single SFT string: instruction + response (the chosen id, nothing else).

    prepare.to_instruction ends the instruction with "### Response" (no
    trailing newline), so one "\\n" joins it to the response — the
    collator's template "### Response\\n" then matches exactly once.
    """
    return f"{example['instruction']}\n{example['response']}"


def run_training(args) -> dict:
    """Real Unsloth QLoRA loop. Runs ONLY on a GPU worker (checked by caller).

    Returns a summary dict for the experiment tracker.
    """
    from unsloth import FastLanguageModel
    from trl import SFTTrainer, SFTConfig
    from transformers import DataCollatorForCompletionOnlyLM
    from datasets import load_dataset
    import torch

    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=args.base_model,
        max_seq_length=4096,
        dtype=None,  # auto: bf16 on Ampere+
        load_in_4bit=True,
    )
    model = FastLanguageModel.get_peft_model(
        model,
        r=args.r,
        lora_alpha=args.alpha,
        lora_dropout=0,
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=args.seed,
        target_modules=[
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj",
        ],
        use_rslora=False,
        loftq_config=None,
    )

    def _format(examples):
        return {"text": [build_training_text(e) for e in examples]}

    train_ds = load_dataset("json", data_files=args.train_data, split="train")
    val_ds = load_dataset("json", data_files=args.val_data, split="train")
    train_ds = train_ds.map(_format, batched=True, remove_columns=train_ds.column_names)
    val_ds = val_ds.map(_format, batched=True, remove_columns=val_ds.column_names)

    # Assistant-only loss masking: the model learns to emit the chosen id,
    # never to parrot the prompt. This is the load-bearing correctness rule.
    collator = DataCollatorForCompletionOnlyLM(
        RESPONSE_TEMPLATE, tokenizer=tokenizer
    )

    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        data_collator=collator,
        args=SFTConfig(
            dataset_text_field="text",
            per_device_train_batch_size=2,
            gradient_accumulation_steps=8,  # effective batch 16
            warmup_ratio=0.03,
            num_train_epochs=args.epochs,
            learning_rate=args.lr,
            optim="adamw_8bit",
            lr_scheduler_type="cosine",
            seed=args.seed,
            logging_steps=10,
            eval_strategy="epoch",
            save_strategy="epoch",
            load_best_model_at_end=True,
            metric_for_best_model="eval_loss",
            greater_is_better=False,
            output_dir=args.output_dir,
            report_to="none",
        ),
    )
    trainer.train()
    model.save_pretrained(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)
    log = trainer.state.log_history
    best_eval = min(
        (e["eval_loss"] for e in log if "eval_loss" in e), default=None
    )
    return {
        "base_model": args.base_model,
        "output_dir": args.output_dir,
        "seed": args.seed,
        "best_eval_loss": best_eval,
        "cuda": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
    }


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    check_environment()
    summary = run_training(args)
    print(f"training {args.base_model} on {args.train_data} -> {args.output_dir}")
    print(f"best eval loss: {summary['best_eval_loss']}")
    print(f"summary: {summary}")


if __name__ == "__main__":
    main()
