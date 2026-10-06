# Sanvada: the Understanding Thesis

**Status:** working definition — 2026-10-06. This document reframes the project.
The consumer app is a demo vehicle. The thesis — and the future product — is
the **pipeline that makes AI understand the human behind the screen**, measured,
improvable, and sellable as an API.

## 1. The reframe

Most AI products optimize for answers. Sanvada optimizes for the person.
But "understanding the user" has always been a vibe, not a number. This thesis
makes it a number — and then moves the number.

The value is not what we give end users. The value is:

1. A **pipeline** that turns raw user interaction into a calibrated,
   versioned model of a specific human (Human Context).
2. **Research** — papers and experiments on what actually makes AI
   understand a human better (see §7).
3. A **small, real improvement**: a fine-tuned selection model that picks
   the right next step for a user better than a prompted general LLM.
4. Eventually, an **API** that product builders integrate so *their*
   agents understand *their* users better — sold on a measured delta.

We do not compete with PostHog/Mixpanel (analytics: what users *did*),
nor with Langfuse/Braintrust (observability: what agents *did*), nor with
Mem0/Zep (memory infra: what to *store*). We sell **depth of understanding**:
what the user *wants next*, predicted better than the builder could alone.

## 2. What "understanding" means — operationally

> **Understanding(U, t)** = the probability that the system selects the
> action/experience/content that user U would themselves choose at time t,
> from a set of N candidates, given everything observed about U so far.

It is measured, not asserted:

- **hit@1**: fraction of held-out user decisions where the system's top
  choice matches the user's actual choice.
- **MRR**: mean reciprocal rank of the user's actual choice in the
  system's ranking.
- **Calibration**: Brier score / ECE of the confidence attached to each
  prediction — a system that is 90% confident should be right 90% of the time.

### The Understanding Quotient (UQ)

Raw hit@1 has a dishonest ceiling: no human agrees with themselves 100%
of the time. Park et al. (2024) show interview-grounded models reach ~85%
of a person's own 2-week test–retest agreement. So we normalize:

> **UQ = hit@1(observed) / hit@1(user's self-agreement)**

- **UQ = 0**: the system knows nothing about this user (random choice).
- **UQ = 1**: telekinesis — the system predicts the user as well as the
  user predicts themselves. This is the asymptote, never fully reached.

This is the number Roger described: *"sin mi API: x; con mi API: y"*,
both measured on the same held-out decisions, both bounded by the same
honest ceiling. The API is sold on **ΔUQ**.

## 3. The pipeline

```
EVENTS → EVIDENCE → CLAIMS → SELECTION → OUTCOME → (back to EVIDENCE)
   │         │          │          │           │
   │    immutable,  versioned,   ranked     recorded
   │    sourced    confidence-   choice     as new
   │               scored                 evidence
   ▼
INGEST ──→ MODEL ──→ SELECT ──→ LEARN
```

- **INGEST** (`POST /api/v1/ingest`): the builder's product sends user
  events — messages, choices, corrections, outcomes. Stored as immutable
  Evidence. Nothing is ever silently overwritten.
- **MODEL** (`POST /api/v1/understand`): evidence is distilled into
  Claims — enduring propositions about the user (`"prefers short
  morning sessions"`, confidence 0.81). Claims are versioned; old
  interpretations stay readable. Confidence is calibrated (§5).
- **SELECT** (`POST /api/v1/select`): given the user model + N candidates
  (experiences, actions, content, replies), return a ranked list with
  scores, rationale, and a reproducibility hash.
- **LEARN**: the outcome of the selected action becomes new evidence;
  confirmations raise confidence, corrections supersede claims.

The whole pipeline sits behind stable contracts. The selection model —
heuristic today, fine-tuned small model tomorrow — is interchangeable.
The benchmark decides, not the code.

## 4. The experiment that sells the API

Every builder integration runs the same protocol on *their own data*:

1. Collect K held-out user decisions (the user chose A from {A, B, C…}).
2. **Baseline** ("sin mi API"): the builder's current approach —
   typically a prompted general LLM — ranks the candidates. Record
   hit@1, MRR, calibration.
3. **Sanvada** ("con mi API"): INGEST the user's history → MODEL →
   SELECT ranks the same candidates. Record the same metrics.
4. Report **Δhit@1, ΔMRR, ΔUQ** with confidence intervals.

Published evidence says the delta is real and favors small specialized
models: on MovieLens hit@1, classical SASRec (0.380) beats prompted
GPT-4o-mini (0.240) (R2Rec, 2025); TALLRec shows a 7B model tuned on
<100 samples beating prompted LLMs (RecSys 2023); PrefEval (ICLR 2025)
shows frontier LLMs at <10% zero-shot preference-following accuracy.
The thesis reproduces this pattern on the builder's own decisions —
that reproduction *is* the sales demo.

## 5. Calibration — the thesis's second number

Nobody reports Brier/ECE on LLM per-user choice prediction (surveyed
2026-10-06; gap confirmed). A system that claims 0.9 confidence about a
user and is right 60% of the time does not "understand" — it bluffs.

The thesis therefore reports **every selection metric alongside
calibration**: Brier score and ECE over the predicted choice
probabilities, plus a calibration curve. The fine-tuned selection model
is trained with this in mind (temperature scaling on a held-out split;
see `research/training/SELECTION_MODEL_TRAINING.md`).

## 6. Ambiguities — resolved

| Ambiguity | Decision |
|---|---|
| What counts as "understanding"? | Per-user selection accuracy (hit@1/MRR on held-out decisions), never chat quality, recall QA, or group-level alignment. |
| What is the ceiling? | The user's own test–retest self-agreement. UQ = 1 is telekinesis; we report distance to it honestly. |
| Is the app the product? | No. The app is the demo vehicle and dogfood client of the API. The product is the pipeline + metric + API. |
| PostHog / observability / memory? | Explicitly not. Analytics measures the past; observability watches the agent; memory stores facts. We predict the user's next choice — and prove it. |
| Cross-user learning? | Never by default. Each user's model is trained only on their data unless they opt in. Understanding is per-user; the *method* is what generalizes. |
| What is "the small improvement"? | A fine-tuned ≤4B selection model that beats a prompted general LLM on the same candidates — measured, not claimed. |
| Language of the thesis? | English for papers/repo; the demo app stays Spanish-first. |

## 7. Related work (surveyed 2026-10-06)

Full sourced survey: `../research_notes/sanvada-user-understanding-research-20261006-1603/report.md`.

- **User-LLM** (Ning et al., 2024): user embeddings fused into the LLM;
  +16.33% over text-prompt timelines. The latent-user-model architecture
  our per-user scorer descends from.
- **Park et al.** (2024, "Generative Agent Simulations of 1,000 People"):
  interview-grounded twins reach ~85% of own test–retest agreement.
  Source of our honest ceiling and UQ normalization.
- **LaMP / LaMP-QA** (Salemi et al., 2023; 2025): closest per-user
  benchmark (7 tasks, accuracy/MAE/ROUGE). Task-framed, not
  choice-framed — our protocol differs deliberately.
- **PrefEval** (Zhao et al., ICLR 2025): frontier LLMs <10% zero-shot
  preference-following at 10 turns. The "LLMs forget the individual"
  result our pipeline attacks.
- **R2Rec / TALLRec / LLM2SASRec** (2023–2025): small fine-tuned or
  classical user models beat prompted GPT-4-class models on per-user
  hit@1. The empirical bet behind our fine-tuned selection model.
- **Mem0 / Zep / MemGPT** (2023–2025): memory infra evaluated on recall
  QA, never on downstream user-decision hit@1. We measure the decision,
  not the recall.
- **Calibration**: no Brier/ECE reported for LLM per-user choice
  prediction anywhere we could find — our second metric fills it.
- **Commercial**: no company sells a measured "user understanding" API
  (verified 2026-10-06). Recommendation APIs price per call with no
  understanding metric; memory APIs price infra with no fidelity metric.
  The gap is real.

## 8. Research questions (the papers)

1. Can per-user selection accuracy (hit@1/MRR on held-out decisions) be
   formalized as a benchmark protocol other builders can adopt?
2. Does a fine-tuned ≤4B selection model beat a prompted general LLM on
   the same candidates — and at what data scale does the crossover happen?
3. Are per-user choice predictions calibrated, and which user-model
   designs (text profile vs. embedding vs. fine-tune) calibrate best?
4. How little user data suffices for above-chance hit@1 (cold start),
   and which representation degrades most gracefully?
5. Does adding a memory system improve hit@1 on the user's *next
   decision* (not recall QA)?

## 9. Roadmap

- [x] Pipeline contracts + heuristic baseline + benchmark harness (Phases 8–16)
- [x] Metric formalized (this document, 2026-10-06)
- [ ] **API v1**: `ingest` / `understand` / `select` as integrable REST + TS client
- [ ] Sin/con API protocol runnable by an external builder on their data
- [ ] Selection-model training spec → GPU run (see `research/training/SELECTION_MODEL_TRAINING.md`)
- [ ] Calibration reporting (Brier/ECE) in the evaluation harness
- [ ] Paper draft: "The Understanding Quotient: measuring per-user selection accuracy"

## 10. Honest limitations

- UQ's ceiling (test–retest agreement) must be measured per deployment;
  until then we report raw hit@1/MRR and mark UQ as estimated.
- Held-out decisions require real user outcomes; synthetic fixtures
  validate the math, not the claim.
- The fine-tuned model does not exist yet — the training spec is written,
  the GPU run is pending.
- Confidence calibration for the current heuristic is unmeasured.
