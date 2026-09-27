"""Tests for the A/B/experimental evaluation comparison (Phase 14, PLAN §42)."""
from sanvada_research.evaluation import run_ab_comparison


def _cases():
    return [
        {
            "objective": "o1",
            "context_summary": "c1",
            "candidates": [
                {"experience_id": "exp-1", "fit": 0.9, "novelty": 0.7, "risk": "low"},
                {"experience_id": "exp-2", "fit": 0.4, "novelty": 0.3, "risk": "high"},
            ],
            "chosen_experience_id": "exp-1",
        },
        {
            "objective": "o2",
            "context_summary": "c2",
            "candidates": [
                {"experience_id": "exp-4", "fit": 0.5, "novelty": 0.5, "risk": "medium"},
                {"experience_id": "exp-3", "fit": 0.85, "novelty": 0.6, "risk": "low"},
            ],
            "chosen_experience_id": "exp-3",
        },
    ]


def _perfect(case):
    return [case["chosen_experience_id"]] + [
        c["experience_id"] for c in case["candidates"] if c["experience_id"] != case["chosen_experience_id"]
    ]


def _reversed(case):
    return list(reversed(_perfect(case)))


def _random_first(case):
    # Always picks the first listed candidate: right on case 1, wrong on case 2.
    return [c["experience_id"] for c in case["candidates"]]


def test_comparison_ranks_baselines_and_computes_deltas():
    report = run_ab_comparison(
        _cases(),
        {
            "general-llm (A)": _perfect,
            "small-base (B)": _reversed,
            "fine-tuned (experimental)": _random_first,
        },
    )
    assert report["baselines"]["general-llm (A)"]["hit_at_1"] == 1.0
    assert report["baselines"]["small-base (B)"]["hit_at_1"] == 0.0
    assert report["baselines"]["fine-tuned (experimental)"]["hit_at_1"] == 0.5
    assert report["verdict"]["winner"] == "general-llm (A)"
    delta = report["deltas"]["fine-tuned (experimental) vs general-llm (A)"]
    assert delta["hit_at_1"] == -0.5


def test_empty_cases_do_not_crash():
    report = run_ab_comparison([], {"general-llm (A)": _perfect})
    assert report["baselines"]["general-llm (A)"]["hit_at_1"] == 0.0
    assert report["verdict"]["winner"] == "general-llm (A)"
