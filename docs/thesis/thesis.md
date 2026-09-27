# Sanvada: a sentient companion for human becoming

**Thesis — Phase 16, 2026-09-27**

## 1. Problem

Most AI products optimize for answers. Sanvada optimizes for the person:
a companion that remembers who you are, understands what you are becoming,
and recommends experiences — not content — that move you toward your
objectives. The core research question: **can a small, specialized model
learn to select the right experience for a human better than a general
LLM, and can it do so inside an architecture that stays honest?**

## 2. Architecture (SCREAM)

- **Domain**: immutable facts about the person — claims, objectives,
  experiences, memory, agent runs. No forbidden dependencies in the
  domain layer (verified by a boundary test).
- **Application**: Mind (routing, safety gate, observability),
  Companion (streaming conversation with Human Context recovery),
  Development (recommend → accept → attempt → report → evidence),
  Experience Selection (`ExperienceSelectionModel` interface).
- **Infrastructure**: Supabase (7 migrations, RLS per `auth.uid`),
  AI Gateway for general LLM calls, SSE streaming.
- **UI**: Biomimetic/Organic 2.0 — calm, breathing, dark-mode-first.

The single most important architectural decision: **the production
selection model must remain behind the `ExperienceSelectionModel`
contract** (Phase 13). Heuristic, gateway LLM, and (later) fine-tuned
Qwen are interchangeable implementations. Nothing in the product depends
on which model is selected — the benchmark decides, not the code.

## 3. Method

1. **Human Context Engine** (Phase 3): compressed, versioned claims
   about the person with confidence scores.
2. **Deterministic baseline** (Phase 8): heuristic selection model
   (0.55·fit + 0.25·novelty − 0.2·risk) with reproducible hashing —
   the bar every learned model must beat.
3. **Research pipeline** (Phases 10–12): uv-only Python package —
   schema-validated selection datasets (`selection-example/v1`),
   append-only experiment tracking, validated QLoRA recipe
   (r=16, alpha=32, lr=2e-4, 2 epochs, seed 7) with assistant-only
   loss masking.
4. **Benchmark** (Phase 11): Qwen3-4B vs Llama-3.2-3B vs Phi-4-mini
   vs heuristic — harness ready, candidates registered.
5. **Evaluation** (Phase 14): baseline A (general LLM) vs baseline B
   (small base) vs experimental (fine-tuned), hit@1 + MRR + deltas.

## 4. Results

| Claim | Status | Evidence |
|---|---|---|
| Architecture compiles, all layers wired | ✅ verified | 70/70 tests, tsc clean, `next build` green |
| Selection contract + heuristic baseline | ✅ verified | deterministic hash, 0.9 hit@1 on unit fixture |
| Production model behind contract | ✅ verified | gateway model validates every output against schema |
| Research pipeline reproducible | ✅ verified | 23/23 pytest, versioned dataset schema, tracked experiments |
| A/B/experimental comparison | ✅ verified (math) | tested with stubs; real rank fns pending |
| Qwen vs Llama vs Phi decision | ⏳ pending | no GPU in this environment; harness + candidates ready |
| Fine-tuning run | ⏳ pending | recipe + masking tested; GPU worker executes |

## 5. Honest limitations

- No model was trained or benchmarked here — there is no GPU and no
  weights were downloaded. Every "pending" above is real pending work,
  not a euphemism.
- Demo data in the UI is clearly labeled; it is not a product claim.
- The rate limiter is in-memory: correct for one server, must move to
  Redis for multi-instance.
- Supabase migrations are written and parsed but not yet applied to a
  live project (Roger creates it).

## 6. Conclusion

Sanvada's contribution is not a number — it is an architecture where
the model that chooses your experiences is **replaceable, benchmarked,
and contract-bound**, and where every claim about the person is
versioned, confidence-scored, and recoverable. The benchmark harness
is armed; the moment a GPU worker runs it, the thesis gets its final
chapter: which small model, if any, beats the general LLM at
understanding what a human needs next.
