"""Fine-tuning dataset preparation (Phase 12, PLAN §40).

Converts validated selection examples (selection-example/v1) into the
instruction format used for SFT of the Experience Selection Model.

Critical masking rule: the loss is computed ONLY on the assistant
tokens (labels != -100 elsewhere is a silent correctness bug — the
model learns to parrot the prompt). The response is exactly the
chosen experience id, nothing else.
"""

from __future__ import annotations

import hashlib
import json
import random
from pathlib import Path


def split_by_user(
    examples: list[dict],
    train_ratio: float = 0.8,
    val_ratio: float = 0.1,
    seed: int = 7,
    max_per_user: int | None = None,
) -> dict[str, list[dict]]:
    """Split examples so NO user_id appears in more than one split.

    A selection model that memorizes users is the opposite of
    understanding. Users are shuffled with the fixed seed, then assigned
    whole to train/val/test. Raises if any example lacks user_id.
    max_per_user caps examples per user (user diversity matters more
    than per-user depth for training efficiency).
    """
    missing = [e.get("example_id", "?") for e in examples if not e.get("user_id")]
    if missing:
        raise ValueError(
            f"{len(missing)} examples lack user_id (e.g. {missing[0]}); "
            "by-user split is impossible"
        )
    by_user: dict[str, list[dict]] = {}
    for e in examples:
        by_user.setdefault(e["user_id"], []).append(e)
    users = sorted(by_user)
    rng = random.Random(seed)
    rng.shuffle(users)
    if max_per_user is not None:
        for u in users:
            lst = by_user[u]
            if len(lst) > max_per_user:
                by_user[u] = rng.sample(lst, max_per_user)
    n = len(users)
    n_train = int(n * train_ratio)
    n_val = int(n * val_ratio)
    splits = {
        "train": users[:n_train],
        "val": users[n_train : n_train + n_val],
        "test": users[n_train + n_val :],
    }
    # Paranoia: verify disjointness (cheap, load-bearing).
    seen: set[str] = set()
    for name, us in splits.items():
        overlap = seen & set(us)
        assert not overlap, f"user leakage in split {name}: {sorted(overlap)[:3]}"
        seen |= set(us)
    return {
        name: [e for u in us for e in by_user[u]] for name, us in splits.items()
    }


def dataset_fingerprint(examples: list[dict]) -> str:
    """sha256 over sorted example_ids — logged with every experiment."""
    ids = sorted(e.get("example_id", "") for e in examples)
    return hashlib.sha256(json.dumps(ids).encode()).hexdigest()[:16]


def to_instruction(example: dict) -> dict:
    """Build the {instruction, response} pair for one selection example."""
    lines = [
        "### Instruction",
        "You are the Experience Selection Model. Given a development",
        "objective, user context, and candidate experiences, respond with",
        "ONLY the experience_id of the best choice.",
        "",
        f"Objective: {example['objective']}",
        f"Context: {example.get('context_summary', '')}",
        "",
        "Candidates:",
    ]
    for c in example["candidates"]:
        lines.append(
            f"- {c['experience_id']}: fit={c['fit']:.2f} "
            f"novelty={c['novelty']:.2f} risk={c['risk']}"
        )
    lines += ["", "### Response"]
    return {
        "example_id": example.get("example_id", ""),
        "instruction": "\n".join(lines),
        "response": example["chosen_experience_id"],
    }


def prepare_dataset(input_jsonl: str, output_jsonl: str) -> int:
    """Convert a selection-v1 JSONL file to SFT instruction JSONL."""
    count = 0
    with open(input_jsonl, encoding="utf-8") as fin, open(
        output_jsonl, "w", encoding="utf-8"
    ) as fout:
        for line in fin:
            line = line.strip()
            if not line:
                continue
            inst = to_instruction(json.loads(line))
            fout.write(json.dumps(inst, ensure_ascii=False) + "\n")
            count += 1
    return count


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument(
        "--split-by",
        choices=["none", "user"],
        default="none",
        help="user: also write train/val/test splits with zero user overlap",
    )
    parser.add_argument("--seed", type=int, default=7)
    parser.add_argument(
        "--max-per-user",
        type=int,
        default=None,
        help="cap examples per user (user diversity > per-user depth)",
    )
    args = parser.parse_args()

    examples = [
        json.loads(line)
        for line in Path(args.input).read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    out = Path(args.output)
    if args.split_by == "user":
        splits = split_by_user(examples, seed=args.seed, max_per_user=args.max_per_user)
        for name, split in splits.items():
            split_path = out.parent / f"{out.stem}-{name}{out.suffix}"
            inst = [to_instruction(e) for e in split]
            split_path.write_text(
                "\n".join(json.dumps(i, ensure_ascii=False) for i in inst),
                encoding="utf-8",
            )
            users = len({e["user_id"] for e in split})
            print(
                f"wrote {len(inst)} instruction examples ({users} users) "
                f"-> {split_path} [fingerprint {dataset_fingerprint(split)}]"
            )
    else:
        n = prepare_dataset(args.input, args.output)
        print(f"wrote {n} instruction examples -> {args.output}")
    print(f"sources live under: {Path(args.output).parent}")
