"""Training configuration for the Experience Selection Model (PLAN §§36, 40).

Honest scope: this module validates the QLoRA recipe and documents the
exact training command. Actual fine-tuning needs a GPU worker (RunPod /
Vast.ai per the research plan); it is NOT executed in this environment.

Recipe (from the research plan): r=16, alpha=32, lr=2e-4, 2 epochs,
batch 16, warmup 3%, cosine schedule, adamw_8bit, all-linear targets,
bnb 4-bit. Assistant-only loss masking (labels != -100 on assistant
tokens only). Early stopping on best val loss.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class QLoRAConfig:
    base_model: str = "Qwen/Qwen3-4B-Instruct-2507"
    r: int = 16
    lora_alpha: int = 32
    learning_rate: float = 2e-4
    epochs: int = 2
    batch_size: int = 16
    warmup_ratio: float = 0.03
    scheduler: str = "cosine"
    optimizer: str = "adamw_8bit"
    target_modules: str = "all-linear"
    load_in_4bit: bool = True
    max_seq_length: int = 4096
    seed: int = 7

    def validate(self) -> None:
        if self.r <= 0 or self.r > 128:
            raise ValueError(f"LoRA rank out of range: {self.r}")
        if self.lora_alpha <= 0:
            raise ValueError("lora_alpha must be positive")
        if not (1e-6 <= self.learning_rate <= 1e-2):
            raise ValueError(f"learning_rate out of range: {self.learning_rate}")
        if self.epochs < 1:
            raise ValueError("epochs must be >= 1")
        if self.batch_size < 1:
            raise ValueError("batch_size must be >= 1")
        if not (0.0 <= self.warmup_ratio < 1.0):
            raise ValueError("warmup_ratio must be in [0, 1)")
        if self.scheduler not in ("cosine", "linear", "constant"):
            raise ValueError(f"unsupported scheduler: {self.scheduler}")
        if self.max_seq_length < 512:
            raise ValueError("max_seq_length too small for instruction data")

    def training_command(self) -> str:
        """The exact command a GPU worker runs. Documented, not executed here."""
        return (
            "uv run python -m sanvada_research.train "
            f"--base-model {self.base_model} --r {self.r} "
            f"--alpha {self.lora_alpha} --lr {self.learning_rate} "
            f"--epochs {self.epochs} --seed {self.seed}"
        )


def default_config() -> QLoRAConfig:
    cfg = QLoRAConfig()
    cfg.validate()
    return cfg
