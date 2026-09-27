# Phase 14 — Research Evaluation (2026-09-27)

## Deliverables (PLAN §42)

- `research/src/sanvada_research/evaluation.py`: `run_ab_comparison` —
  baseline A (general LLM) vs baseline B (small base) vs experimental
  (fine-tuned) on one fixed dataset. Per-baseline hit@1/MRR, pairwise
  deltas vs baseline A, and a verdict (winner + whether the fine-tuned
  model beats baseline A).

## Verification

- TDD: `tests/test_evaluation.py` — RED first, then GREEN (one fixture
  ordering bug in the test, fixed).
- `uv run pytest`: **23/23 green**.

## Honest scope note

The comparison math is real and tested; plugging in the real rank
functions needs an API key (baseline A), model weights + GPU
(baseline B), and the Phase 12 trained adapter (experimental).
The verdict logic already answers the research question the moment
those exist: does the fine-tuned model beat the general LLM?
