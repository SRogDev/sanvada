"""Tests for the benchmark harness (Phase 11, PLAN §38)."""
import json

from sanvada_research.benchmark import (
    BenchmarkHarness,
    ModelCard,
    load_candidates,
)


def _cases():
    return [
        {
            "objective": "Reflect more",
            "context_summary": "journals sporadically",
            "candidates": [
                {"experience_id": "exp-1", "fit": 0.9, "novelty": 0.7, "risk": "low"},
                {"experience_id": "exp-2", "fit": 0.5, "novelty": 0.3, "risk": "high"},
            ],
            "chosen_experience_id": "exp-1",
        },
        {
            "objective": "Move daily",
            "context_summary": "likes night walks",
            "candidates": [
                {"experience_id": "exp-3", "fit": 0.85, "novelty": 0.6, "risk": "low"},
                {"experience_id": "exp-4", "fit": 0.7, "novelty": 0.9, "risk": "medium"},
            ],
            "chosen_experience_id": "exp-4",
        },
    ]


def _heuristic_rank(case):
    # Same formula as the TS HeuristicSelectionModel: 0.55*fit + 0.25*novelty - 0.2*risk
    penalty = {"low": 0.0, "medium": 0.15, "high": 0.35}
    ranked = sorted(
        case["candidates"],
        key=lambda c: (
            0.55 * c["fit"] + 0.25 * c["novelty"] - 0.2 * penalty[c["risk"]],
            c["experience_id"],
        ),
        reverse=True,
    )
    return [c["experience_id"] for c in ranked]


def test_harness_scores_a_runnable_model(tmp_path):
    harness = BenchmarkHarness()
    report = harness.run_model(
        ModelCard(name="heuristic-1.0.0", params="n/a", source="deterministic", status="ready"),
        _cases(),
        _heuristic_rank,
    )
    assert report["cases"] == 2
    assert 0.0 <= report["hit_at_1"] <= 1.0
    assert report["status"] == "completed"
    assert len(report["per_case"]) == 2


def test_pending_gpu_models_are_listed_honestly():
    from pathlib import Path

    candidates_path = Path(__file__).resolve().parent.parent / "benchmarks" / "candidates.json"
    cards = load_candidates(str(candidates_path))
    names = [c.name for c in cards]
    assert "Qwen3-4B-Instruct-2507" in names
    assert "Llama-3.2-3B-Instruct" in names
    assert "Phi-4-mini-instruct" in names
    pending = [c for c in cards if c.status == "pending-gpu"]
    assert len(pending) >= 3
    # The plan forbids hard-coding Qwen as final before the benchmark.
    assert all(c.status != "selected" for c in cards)


def test_full_report_marks_pending_models(tmp_path):
    harness = BenchmarkHarness()
    cards = [
        ModelCard(name="heuristic-1.0.0", params="n/a", source="deterministic", status="ready"),
        ModelCard(name="Qwen3-4B-Instruct-2507", params="4B", source="hf", status="pending-gpu"),
    ]
    report = harness.run_all(cards, _cases(), {"heuristic-1.0.0": _heuristic_rank})
    assert report["models"]["heuristic-1.0.0"]["status"] == "completed"
    assert report["models"]["Qwen3-4B-Instruct-2507"]["status"] == "pending-gpu"
    out = tmp_path / "report.json"
    out.write_text(json.dumps(report), encoding="utf-8")
    assert json.loads(out.read_text())["models"]["heuristic-1.0.0"]["hit_at_1"] >= 0
