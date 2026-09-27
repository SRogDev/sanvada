# Phase 11 — Model Benchmark (2026-09-27)

## Deliverables (PLAN §38)

- `research/src/sanvada_research/benchmark.py`: `BenchmarkHarness`
  (hit@1, MRR, per-case ranks, JSON report) + `ModelCard` registry +
  CLI for a GPU worker.
- `research/benchmarks/candidates.json`: heuristic-1.0.0 (ready),
  Qwen3-4B-Instruct-2507, Llama-3.2-3B-Instruct, Phi-4-mini-instruct
  (all `pending-gpu`).

## Verification

- TDD: `tests/test_benchmark.py` — RED first, then GREEN.
- `uv run pytest`: **18/18 green**.
- Harness genuinely scores the heuristic baseline; GPU candidates are
  reported as `pending-gpu`, never with invented numbers.

## Honest result

The benchmark **decision is pending**: no GPU in this environment, so
Qwen vs Llama vs Phi cannot be run here. Per PLAN §40, Qwen3-4B
remains the *initial candidate only* — nothing is marked `selected`.
The harness, dataset schema, candidate registry, and the exact GPU
command are ready; a GPU worker runs
`uv run python -m sanvada_research.benchmark --dataset research/datasets/selection-v1.jsonl`.
