# Phase 10 — Research Infrastructure (2026-09-27)

## Deliverables (PLAN §§35–37)

`research/` is a **uv-only** Python project (`pyproject.toml`, `uv.lock`
committed), deliberately outside the application runtime — nothing in
`src/` may import from it.

- `src/sanvada_research/datasets.py`: anonymized selection records →
  versioned (`selection-example/v1`), schema-validated training examples
  with deterministic content-hash IDs; JSONL writer.
- `src/sanvada_research/experiments.py`: append-only JSONL experiment
  tracking — config hash, seed, metrics, artifacts, status; a run is
  re-runnable from its logged config alone.
- `src/sanvada_research/training_config.py`: validated QLoRA recipe
  (r=16, alpha=32, lr=2e-4, 2 epochs, batch 16, warmup 3%, cosine,
  adamw_8bit, all-linear, bnb 4-bit) + the exact documented training
  command for a GPU worker.

## Verification

- `uv run pytest`: **15/15 green** (dataset validation incl. rejection
  cases, run lifecycle, config validation).
- App side unaffected: `tsc` clean, **58/58 vitest**, `next build` green.

## Honest scope note

No real fine-tuning happens here: this environment has no GPU and
limited bandwidth for multi-GB weights. The pipeline (dataset →
validated config → tracked experiment) is real and tested; the
`train` module itself is a documented scaffold whose exact command a
GPU worker runs in Phase 12.
