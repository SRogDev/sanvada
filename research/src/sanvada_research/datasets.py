"""Dataset collection for the Experience Selection Model (PLAN §§35-37).

Converts anonymized conversations + human-context snapshots into
versioned, schema-validated training examples. Every example carries
its schema version; nothing here touches the application runtime.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass, field

SCHEMA_VERSION = "selection-example/v1"


@dataclass(frozen=True)
class Candidate:
    experience_id: str
    fit: float
    novelty: float
    risk: str  # low | medium | high


@dataclass(frozen=True)
class TrainingExample:
    schema_version: str
    objective: str
    context_summary: str
    candidates: tuple[Candidate, ...]
    chosen_experience_id: str
    rationale: str
    source: str  # curated | synthetic | human-validated
    example_id: str = field(default="")

    def with_id(self) -> "TrainingExample":
        digest = hashlib.sha256(
            json.dumps(
                {
                    "objective": self.objective,
                    "context": self.context_summary,
                    "candidates": [asdict(c) for c in self.candidates],
                    "chosen": self.chosen_experience_id,
                },
                sort_keys=True,
            ).encode()
        ).hexdigest()[:16]
        return TrainingExample(
            schema_version=self.schema_version,
            objective=self.objective,
            context_summary=self.context_summary,
            candidates=self.candidates,
            chosen_experience_id=self.chosen_experience_id,
            rationale=self.rationale,
            source=self.source,
            example_id=f"ex-{digest}",
        )


def validate_example(ex: TrainingExample) -> None:
    """Raise ValueError on any schema violation."""
    if ex.schema_version != SCHEMA_VERSION:
        raise ValueError(f"unsupported schema version: {ex.schema_version}")
    if not ex.objective.strip():
        raise ValueError("objective must not be empty")
    if not ex.candidates:
        raise ValueError("at least one candidate required")
    ids = [c.experience_id for c in ex.candidates]
    if ex.chosen_experience_id not in ids:
        raise ValueError("chosen_experience_id must be one of the candidates")
    for c in ex.candidates:
        if not (0.0 <= c.fit <= 1.0 and 0.0 <= c.novelty <= 1.0):
            raise ValueError("fit/novelty must be in [0, 1]")
        if c.risk not in ("low", "medium", "high"):
            raise ValueError(f"invalid risk: {c.risk}")
    if ex.source not in ("curated", "synthetic", "human-validated"):
        raise ValueError(f"invalid source: {ex.source}")


def build_selection_examples(records: list[dict]) -> list[TrainingExample]:
    """Build validated examples from anonymized selection records.

    Each record: {objective, context_summary, candidates:[...],
                  chosen_experience_id, rationale, source}.
    """
    examples = []
    for rec in records:
        ex = TrainingExample(
            schema_version=SCHEMA_VERSION,
            objective=rec["objective"],
            context_summary=rec.get("context_summary", ""),
            candidates=tuple(Candidate(**c) for c in rec["candidates"]),
            chosen_experience_id=rec["chosen_experience_id"],
            rationale=rec.get("rationale", ""),
            source=rec.get("source", "curated"),
        ).with_id()
        validate_example(ex)
        examples.append(ex)
    return examples


def write_jsonl(examples: list[TrainingExample], path: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        for ex in examples:
            d = asdict(ex)
            d["candidates"] = [asdict(c) for c in ex.candidates]
            f.write(json.dumps(d, ensure_ascii=False) + "\n")
