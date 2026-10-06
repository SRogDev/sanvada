"""Tests for the A/B/experimental evaluation comparison (Phase 14, PLAN §42)."""
import pytest

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

from sanvada_research.evaluation import (
    brier_score,
    expected_calibration_error,
    run_ab_comparison,
)


def _cal_cases():
    return [
        {"chosen_experience_id": "a"},
        {"chosen_experience_id": "b"},
    ]


def _perfect_probs(case):
    return {"a": 0.9, "b": 0.1} if case["chosen_experience_id"] == "a" else {"a": 0.1, "b": 0.9}


def _bluffing_probs(case):
    # always 99% confident, right only half the time
    return {"a": 0.99, "b": 0.01}


def test_brier_score_perfect_is_zero():
    assert brier_score(_perfect_probs, _cal_cases()) == pytest.approx(0.02, abs=1e-9)


def test_brier_score_none_without_prob_fn():
    assert brier_score(None, _cal_cases()) is None


def test_ece_detects_bluffing():
    ece = expected_calibration_error(_bluffing_probs, _cal_cases())
    assert ece == pytest.approx(0.49, abs=1e-9)
    assert expected_calibration_error(_perfect_probs, _cal_cases()) < 0.15


def test_run_ab_comparison_reports_calibration():
    rank = lambda case: ["a", "b"]  # noqa: E731
    report = run_ab_comparison(
        _cal_cases(), {"m": rank}, {"m": _perfect_probs}
    )
    assert report["baselines"]["m"]["brier_score"] is not None
    assert report["baselines"]["m"]["ece"] is not None
    # backward compatible: no prob_fns -> None calibration, math unchanged
    report2 = run_ab_comparison(_cal_cases(), {"m": rank})
    assert report2["baselines"]["m"]["brier_score"] is None
    assert report2["baselines"]["m"]["hit_at_1"] == 0.5
