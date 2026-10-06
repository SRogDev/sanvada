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


def brier_score(prob_fn, cases: list[dict]) -> float | None:
    """Multiclass Brier score over the candidate distribution.

    prob_fn(case) -> {experience_id: probability}. Returns None when the
    baseline does not emit probabilities (e.g. the deterministic heuristic).
    Lower is better; 0 is perfect.
    """
    if prob_fn is None:
        return None
    total, n = 0.0, 0
    for case in cases:
        probs = prob_fn(case)
        if not probs:
            return None
        expected = case["chosen_experience_id"]
        total += sum(
            (p - (1.0 if cid == expected else 0.0)) ** 2
            for cid, p in probs.items()
        )
        n += 1
    return total / n if n else None


def expected_calibration_error(
    prob_fn, cases: list[dict], n_bins: int = 10
) -> float | None:
    """ECE of the top-1 confidence: |accuracy - confidence| per bin.

    A system that says 90% and is right 60% of the time does not
    "understand" — it bluffs. None when probabilities are unavailable.
    """
    if prob_fn is None:
        return None
    bins: list[list[float]] = [[] for _ in range(n_bins)]
    bin_correct: list[list[int]] = [[] for _ in range(n_bins)]
    n = 0
    for case in cases:
        probs = prob_fn(case)
        if not probs:
            return None
        top_id = max(probs, key=lambda k: probs[k])
        conf = probs[top_id]
        b = min(int(conf * n_bins), n_bins - 1)
        bins[b].append(conf)
        bin_correct[b].append(1 if top_id == case["chosen_experience_id"] else 0)
        n += 1
    if n == 0:
        return None
    ece = 0.0
    for b in range(n_bins):
        if not bins[b]:
            continue
        acc = sum(bin_correct[b]) / len(bins[b])
        conf = sum(bins[b]) / len(bins[b])
        ece += (len(bins[b]) / n) * abs(acc - conf)
    return ece


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


def run_ab_comparison(
    cases: list[dict],
    rank_fns: dict,
    prob_fns: dict | None = None,
) -> dict:
    """Compare baselines on the same cases. Returns scores, deltas, verdict.

    prob_fns (optional): {baseline_name: fn(case) -> {id: probability}}.
    When provided, each baseline also reports brier_score and ece —
    the calibration half of the thesis metric.
    """
    prob_fns = prob_fns or {}
    baselines = {name: _score(rank_fns[name], cases) for name in rank_fns}
    for name in baselines:
        pf = prob_fns.get(name)
        baselines[name]["brier_score"] = brier_score(pf, cases)
        baselines[name]["ece"] = expected_calibration_error(pf, cases)
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
