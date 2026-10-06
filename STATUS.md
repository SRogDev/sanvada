# STATUS — sanvada

> Single source of truth for where this project stands. Last updated: 2026-10-06.
> Read this before starting work. Update it in the same PR when reality changes.

## Done
- 2026-09-27 — Fases 0–16 done: SCREAM app, Supabase migrations 001–007, Human Context, Memory, Mind, Companion, Development, Experiences, Sentient UI, research infra, benchmark harness, QLoRA prep, production selection model, A/B evaluation, hardening, thesis.
- 2026-10-06 — **Thesis reframed** (`docs/UNDERSTANDING.md`): Sanvada is a thesis + future API on *machine understanding of the human user*, not a consumer app. UQ metric (hit@1/MRR normalized by test–retest self-agreement), sin/con API protocol, related-work survey (no "user understanding API" exists commercially — gap confirmed).
- 2026-10-06 — **API v1** (`POST /api/v1/ingest`, `/understand`, `/select`): key auth, rate limit, Zod validation, TS client (`src/api-client/`), integration guide (`docs/API.md`). In-memory store behind port; heuristic v0 behind contracts. 82/82 vitest, build green.
- 2026-10-06 — **Training spec frozen** (`research/training/SELECTION_MODEL_TRAINING.md`): 3-tier data plan, QLoRA recipe, by-user splits, calibration (Brier/ECE), acceptance criteria, GPU runbook. Not executed — pending GPU.
- 2026-10-06 — **Real benchmark Tier 1 (LaMP-2)**: adapter `research/src/sanvada_research/lamp2.py` (user-based split, 326 train / 50 test users, zero overlap verified); baselines on 50 real users — profile-frequency hit@1 **0.300** / MRR 0.500 / ECE 0.139 vs global-majority hit@1 0.080 (per-user info = 3.75×). SFT data built: 17.4k train / 2k val / 2.4k test (by user, ≤100/user). Real Unsloth loop in `train.py` (assistant-only masking via DataCollatorForCompletionOnlyLM); calibration (Brier/ECE) in `evaluation.py`. 39/39 pytest.

## In progress / blocked
- Blocked on Roger: Supabase project + apply migrations 001–007 + 2-user isolation test + `supabase gen types`.
- Blocked on GPU worker: benchmark harness run (Qwen3-4B vs Llama-3.2-3B vs Phi-4-mini) + fine-tuning run per training spec.
- Pending: calibration reporting (Brier/ECE) in the evaluation harness; paper draft "The Understanding Quotient".

## Next
- External builder pilot of the sin/con API protocol on their own held-out decisions (the sales demo).
- Paper draft once Tier 1 (LaMP-2) numbers exist.
