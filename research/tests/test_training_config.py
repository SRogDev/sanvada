"""Tests for the training config scaffold (Phase 10, PLAN §36)."""
import pytest

from sanvada_research.training_config import QLoRAConfig, default_config


def test_default_config_is_valid():
    cfg = default_config()
    assert cfg.r == 16
    assert cfg.learning_rate == 2e-4
    assert "Qwen3-4B" in cfg.base_model


def test_rejects_bad_rank():
    with pytest.raises(ValueError, match="rank"):
        QLoRAConfig(r=0).validate()


def test_rejects_bad_lr():
    with pytest.raises(ValueError, match="learning_rate"):
        QLoRAConfig(learning_rate=10.0).validate()


def test_rejects_bad_scheduler():
    with pytest.raises(ValueError, match="scheduler"):
        QLoRAConfig(scheduler="plateau").validate()


def test_training_command_is_documented():
    cmd = default_config().training_command()
    assert "sanvada_research.train" in cmd
    assert "--seed 7" in cmd
