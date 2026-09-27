"""Tests for the research dataset pipeline (Phase 10, PLAN §§35-37)."""
import pytest

from sanvada_research.datasets import (
    SCHEMA_VERSION,
    build_selection_examples,
    validate_example,
    write_jsonl,
)


def _record(**over):
    rec = {
        "objective": "Become more reflective",
        "context_summary": "User journals sporadically, likes night walks",
        "candidates": [
            {"experience_id": "exp-1", "fit": 0.8, "novelty": 0.7, "risk": "low"},
            {"experience_id": "exp-2", "fit": 0.6, "novelty": 0.4, "risk": "medium"},
        ],
        "chosen_experience_id": "exp-1",
        "rationale": "Matches reflection goal with low risk",
        "source": "curated",
    }
    rec.update(over)
    return rec


def test_build_produces_valid_examples_with_stable_ids():
    examples = build_selection_examples([_record(), _record()])
    assert len(examples) == 2
    assert all(e.schema_version == SCHEMA_VERSION for e in examples)
    # Same input -> same deterministic example id
    assert examples[0].example_id == examples[1].example_id
    assert examples[0].example_id.startswith("ex-")


def test_different_choice_gives_different_id():
    a = build_selection_examples([_record()])[0]
    b = build_selection_examples([_record(chosen_experience_id="exp-2")])[0]
    assert a.example_id != b.example_id


def test_rejects_unknown_chosen_id():
    with pytest.raises(ValueError, match="one of the candidates"):
        build_selection_examples([_record(chosen_experience_id="exp-999")])


def test_rejects_bad_fit_range():
    rec = _record()
    rec["candidates"][0]["fit"] = 1.5
    with pytest.raises(ValueError, match="\\[0, 1\\]"):
        build_selection_examples([rec])


def test_rejects_bad_risk():
    rec = _record()
    rec["candidates"][0]["risk"] = "extreme"
    with pytest.raises(ValueError, match="invalid risk"):
        build_selection_examples([rec])


def test_rejects_empty_objective():
    with pytest.raises(ValueError, match="objective"):
        build_selection_examples([_record(objective="  ")])


def test_write_jsonl_roundtrip(tmp_path):
    examples = build_selection_examples([_record()])
    path = str(tmp_path / "train.jsonl")
    write_jsonl(examples, path)
    lines = open(path, encoding="utf-8").read().strip().split("\n")
    assert len(lines) == 1
    import json

    row = json.loads(lines[0])
    assert row["chosen_experience_id"] == "exp-1"
    assert len(row["candidates"]) == 2
