# Phase 12 — Fine-tuning (2026-09-27)

## Deliverables (PLAN §40)

- `research/src/sanvada_research/prepare.py`: selection-v1 examples →
  SFT instruction format. Response is exactly the chosen experience id;
  loss masking is assistant-only by construction (labels -100 elsewhere).
- `research/src/sanvada_research/train.py`: QLoRA entry point —
  `check_environment()` fails fast with actionable guidance when
  torch/unsloth/CUDA are absent (no confusing ImportError); arg parsing
  for the full recipe (r=16, alpha=32, lr=2e-4, 2 epochs, seed 7).

## Verification

- TDD: `tests/test_finetune.py` — RED first, then GREEN.
- `uv run pytest`: **21/21 green**.

## Honest scope note

The Unsloth training loop itself runs on a GPU worker, not here.
What determines reproducibility — config, data format, seed, masking
rule — is specified and tested; the worker executes the documented
command from Phase 10.
