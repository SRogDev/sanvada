"""Tests for fine-tuning dataset prep + training entry (Phase 12, PLAN §40)."""
import pytest

from sanvada_research.prepare import to_instruction


def _example():
    return {
        "example_id": "ex-abc123",
        "objective": "Become more reflective",
        "context_summary": "journals sporadically",
        "candidates": [
            {"experience_id": "exp-1", "fit": 0.8, "novelty": 0.7, "risk": "low"},
            {"experience_id": "exp-2", "fit": 0.5, "novelty": 0.4, "risk": "high"},
        ],
        "chosen_experience_id": "exp-1",
        "rationale": "low risk, high fit",
    }


def test_instruction_format_has_system_user_assistant():
    inst = to_instruction(_example())
    assert "### Instruction" in inst["instruction"]
    assert "### Response" in inst["instruction"]
    assert inst["response"] == "exp-1"
    # The model must see the candidates to choose from.
    assert "exp-1" in inst["instruction"] and "exp-2" in inst["instruction"]


def test_response_is_only_the_choice():
    # Assistant-only masking depends on the response being exactly the id.
    inst = to_instruction(_example())
    assert inst["response"].strip() == "exp-1"


def test_train_entry_rejects_missing_deps_gracefully():
    from sanvada_research.train import check_environment

    # In this environment torch/unsloth are absent: must raise a clear,
    # actionable error — not an ImportError traceback.
    with pytest.raises(RuntimeError, match="GPU worker"):
        check_environment()
