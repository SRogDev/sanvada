"""Fine-tuning dataset preparation (Phase 12, PLAN §40).

Converts validated selection examples (selection-example/v1) into the
instruction format used for SFT of the Experience Selection Model.

Critical masking rule: the loss is computed ONLY on the assistant
tokens (labels != -100 elsewhere is a silent correctness bug — the
model learns to parrot the prompt). The response is exactly the
chosen experience id, nothing else.
"""

from __future__ import annotations

import json
from pathlib import Path


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
    args = parser.parse_args()
    n = prepare_dataset(args.input, args.output)
    print(f"wrote {n} instruction examples -> {args.output}")
    print(f"sources live under: {Path(args.output).parent}")
