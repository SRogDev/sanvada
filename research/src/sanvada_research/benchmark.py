"""Model benchmark harness (Phase 11, PLAN §38).

Compares small-model candidates for the Experience Selection Model on a
fixed, versioned selection dataset. Metrics: hit@1, MRR, per-case ranks.

Honest execution model: only models with status "ready" can run in this
environment (the deterministic heuristic baseline). GPU candidates are
listed with status "pending-gpu" and reported as such — never scored
with invented numbers. A GPU worker runs them with:
    uv run python -m sanvada_research.benchmark --dataset research/datasets/selection-v1.jsonl
"""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from pathlib import Path

CANDIDATES_PATH = "research/benchmarks/candidates.json"


@dataclass(frozen=True)
class ModelCard:
    name: str
    params: str
    source: str
    status: str  # ready | pending-gpu | selected


def load_candidates(path: str = CANDIDATES_PATH) -> list[ModelCard]:
    raw = json.loads(Path(path).read_text(encoding="utf-8"))
    return [ModelCard(**c) for c in raw["candidates"]]


class BenchmarkHarness:
    """Runs the selection benchmark for every candidate."""

    def run_model(
        self,
        card: ModelCard,
        cases: list[dict],
        rank_fn=None,
    ) -> dict:
        if card.status != "ready" or rank_fn is None:
            return {
                "model": card.name,
                "params": card.params,
                "status": "pending-gpu",
                "cases": len(cases),
                "hit_at_1": None,
                "mrr": None,
                "per_case": [],
                "note": "Requires a GPU worker; not executed in this environment.",
            }
        per_case = []
        for case in cases:
            ranked = rank_fn(case)
            expected = case["chosen_experience_id"]
            rank = ranked.index(expected) if expected in ranked else -1
            per_case.append(
                {
                    "expected": expected,
                    "ranked": ranked,
                    "hit_at_1": rank == 0,
                    "reciprocal_rank": 1 / (rank + 1) if rank >= 0 else 0.0,
                }
            )
        n = len(per_case)
        return {
            "model": card.name,
            "params": card.params,
            "status": "completed",
            "cases": n,
            "hit_at_1": sum(1 for p in per_case if p["hit_at_1"]) / n if n else 0.0,
            "mrr": sum(p["reciprocal_rank"] for p in per_case) / n if n else 0.0,
            "per_case": per_case,
        }

    def run_all(
        self,
        cards: list[ModelCard],
        cases: list[dict],
        rank_fns: dict[str, object] | None = None,
    ) -> dict:
        rank_fns = rank_fns or {}
        models = {
            c.name: self.run_model(c, cases, rank_fns.get(c.name)) for c in cards
        }
        completed = [m for m in models.values() if m["status"] == "completed"]
        return {
            "benchmark": "experience-selection/v1",
            "models": models,
            "summary": {
                "completed": len(completed),
                "pending_gpu": len(models) - len(completed),
                "best_hit_at_1": max(
                    (m["hit_at_1"] for m in completed if m["hit_at_1"] is not None),
                    default=None,
                ),
            },
        }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the selection benchmark.")
    parser.add_argument("--dataset", required=True, help="JSONL selection dataset")
    parser.add_argument("--candidates", default=CANDIDATES_PATH)
    parser.add_argument("--out", default="research/benchmarks/report.json")
    args = parser.parse_args()

    cases = [
        json.loads(line)
        for line in Path(args.dataset).read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    harness = BenchmarkHarness()
    report = harness.run_all(load_candidates(args.candidates), cases)
    Path(args.out).write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report["summary"], indent=2))


if __name__ == "__main__":
    main()
