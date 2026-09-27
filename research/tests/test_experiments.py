"""Tests for experiment tracking (Phase 10, PLAN §37)."""
from sanvada_research.experiments import ExperimentTracker, config_hash


def test_run_lifecycle_is_logged(tmp_path):
    tracker = ExperimentTracker(tmp_path / "runs.jsonl")
    config = {"model": "heuristic-1.0.0", "dataset": "v1"}
    run = tracker.start_run("baseline-eval", config, seed=7)
    tracker.log_metric(run, "hit_at_1", 0.83)
    tracker.log_artifact(run, "eval/report.json")
    tracker.finish(run)

    events = tracker.load_runs()
    kinds = [e["event"] for e in events]
    assert kinds == ["start", "metric", "artifact", "finish"]
    assert events[0]["config_hash"] == config_hash(config)
    assert events[0]["seed"] == 7
    assert events[1]["metrics"]["hit_at_1"] == 0.83
    assert events[2]["artifacts"] == ["eval/report.json"]
    assert events[3]["status"] == "finished"
    assert events[3]["finished_at"] is not None


def test_same_config_same_hash():
    assert config_hash({"a": 1, "b": 2}) == config_hash({"b": 2, "a": 1})
    assert config_hash({"a": 1}) != config_hash({"a": 2})


def test_empty_log_loads_empty(tmp_path):
    tracker = ExperimentTracker(tmp_path / "runs.jsonl")
    assert tracker.load_runs() == []
