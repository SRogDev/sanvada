# Sanvada research

Research infrastructure is **deliberately outside the application runtime**
(PLAN §§2, 15, and the SCREAM layout in PLAN §3). Nothing in `src/` may
import from `research/`, and production tables never depend on research tables.

## Scope (lands in Phases 10–14, 16)

- `datasets/` — versioned JSONL datasets, validated by Zod schemas before training
- `generation/` — hybrid dataset generation (curated catalog + synthetic
  scenarios + LLM-assisted generation + human validation)
- `training/` — Unsloth LoRA/QLoRA fine-tuning of the Experience Selection Model
- `evaluation/` — benchmark harness: baseline A (general LLM) vs baseline B
  (small base model) vs experimental (fine-tuned)
- `experiments/` — experiment tracking for every research run
- `analysis/` — results, ablations, thesis material

## Conventions

- **uv is the only Python workflow**: `uv venv`, deps in `pyproject.toml`,
  `uv sync`, `uv.lock` committed. Never bare pip.
- PyTorch + Hugging Face ecosystem + Unsloth.
- Initial candidate: `Qwen3-4B-Instruct-2507` — do NOT hard-code it as final
  before the Phase 11 benchmark (Qwen vs Llama vs Phi vs justified others).
- Every training example carries a versioned schema; synthetic generation is
  independently validated (never the same model as generator and evaluator).
- Reproducibility: fixed seeds, raw logs, exact commands, artifact versioning.
