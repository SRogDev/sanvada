"""Research evaluation: baseline A vs baseline B vs experimental (Phase 14, PLAN §42).

Compares the three selection approaches on one fixed dataset:
  - general-llm (A): general-purpose LLM via AI Gateway
  - small-base (B): small base model, no fine-tuning
  - fine-tuned (experimental): the QLoRA model from Phase 12

Each baseline is a rank function `case -> [experience_id, ...]`. In this
environment the real model calls need keys/GPU, so production plugs in
real rank functions; the comparison math is fully tested with stubs.
"""

from __future__ import annotations

BASELINES = ("general-llm (A)", "small-base (B)", "fine-tuned (experimental)")


def _score(rank_fn, cases: list[dict]) -> dict:
    per_case = []
    for case in cases:
        ranked = rank_fn(case)
        expected = case["chosen_experience_id"]
        rank = ranked.index(expected) if expected in ranked else -1
        per_case.append(
            {
                "expected": expected,
                "hit_at_1": rank == 0,
                "reciprocal_rank": 1 / (rank + 1) if rank >= 0 else 0.0,
            }
        )
    n = len(per_case)
    return {
        "cases": n,
        "hit_at_1": sum(1 for p in per_case if p["hit_at_1"]) / n if n else 0.0,
        "mrr": sum(p["reciprocal_rank"] for p in per_case) / n if n else 0.0,
    }


def run_ab_comparison(cases: list[dict], rank_fns: dict) -> dict:
    """Compare baselines on the same cases. Returns scores, deltas, verdict."""
    baselines = {name: _score(rank_fns[name], cases) for name in rank_fns}
    # Pairwise deltas vs baseline A (the reference to beat).
    deltas = {}
    ref = baselines.get("general-llm (A)")
    if ref:
        for name, scores in baselines.items():
            if name == "general-llm (A)":
                continue
            deltas[f"{name} vs general-llm (A)"] = {
                "hit_at_1": round(scores["hit_at_1"] - ref["hit_at_1"], 4),
                "mrr": round(scores["mrr"] - ref["mrr"], 4),
            }
    winner = max(baselines, key=lambda n: (baselines[n]["hit_at_1"], baselines[n]["mrr"]))
    return {
        "evaluation": "selection-ab/v1",
        "cases": len(cases),
        "baselines": baselines,
        "deltas": deltas,
        "verdict": {
            "winner": winner,
            "winner_hit_at_1": baselines[winner]["hit_at_1"],
            "beats_baseline_a": winner == "fine-tuned (experimental)"
            and deltas.get("fine-tuned (experimental) vs general-llm (A)", {}).get(
                "hit_at_1", 0
            )
            > 0,
        },
    }
