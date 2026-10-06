# Selection Model — Complete Training Specification

**Status:** specification frozen 2026-10-06. **Not executed** — no GPU in this
environment. A GPU worker (or future Roger) follows this document verbatim;
nothing here should require a judgment call.

**Goal:** a fine-tuned ≤4B selection model that beats a prompted general LLM
on **hit@1 / MRR over held-out user decisions**, with calibration (Brier/ECE)
no worse than the baseline. This is the "small improvement" of
`docs/UNDERSTANDING.md` §6 — measured, not claimed.

## 1. Task definition

Given `(user context, candidate set)`, output **exactly the chosen
experience id**. This is a *selection* task, not generation: the response
vocabulary is constrained to the candidate ids, which makes a small model
competitive (cf. R2Rec 2025: SASRec hit@1 0.380 vs GPT-4o-mini 0.240).

## 2. Data — three tiers, honest labels

Every example: `{ objective, context_summary, candidates[{id, fit, novelty,
risk}], chosen_experience_id, rationale, source }`, schema
`selection-example/v1` (`research/src/sanvada_research/datasets.py`).

| Tier | Source | Use | Honest label |
|---|---|---|---|
| 0 — smoke | synthetic fixtures | validate the math end-to-end | proves nothing about users |
| 1 — benchmark | **LaMP-2** (Salemi et al., 2023), movie-tagging task reframed: user profile → 15 candidate tags → chosen tag | reproducible public numbers; model selection | real users, proxy task |
| 2 — thesis | builder decisions via the API sin/con protocol (`docs/API.md`): held-out `(user, candidates, chosen)` triples | the actual claim | real users, real task |

**Rules:**
- Split **by user**: no user appears in both train and test. A model that
  memorizes users is the opposite of understanding.
- Tier 0 never trains a claimed model; Tier 1 decides the architecture;
  Tier 2 decides the thesis.
- Minimum Tier 2 size for a claim: 200 held-out decisions across ≥20 users.
  Below that, report Tier 1 only.

## 3. Instruction format

`research/src/sanvada_research/prepare.py::to_instruction` (tested):

```
### Instruction
You are the Experience Selection Model. Given a development
objective, user context, and candidate experiences, respond with
ONLY the experience_id of the best choice.

Objective: <objective>
Context: <context_summary>

Candidates:
- <id>: fit=0.80 novelty=0.60 risk=low
...

### Response
<chosen_experience_id>
```

**Masking (critical):** loss on assistant tokens only (`labels = -100`
elsewhere). Verified by test — a model trained on prompt tokens learns to
parrot the prompt, silently.

## 4. Model and recipe

- **Primary:** `Qwen/Qwen3-4B-Instruct-2507` (registered Phase 11).
- **Fallback:** `meta-llama/Llama-3.2-3B-Instruct`.
- **Method:** QLoRA via Unsloth, bnb 4-bit.

| Hyperparameter | Value | Rationale |
|---|---|---|
| LoRA rank r / alpha | 16 / 32 | validated config; small task, small rank |
| Learning rate | 2e-4 | standard for 4B QLoRA SFT |
| Epochs | 2 | early stopping on best **val loss** |
| Batch size | 16 (with grad accumulation as needed) | — |
| Warmup | 3%, cosine schedule | — |
| Optimizer | adamw_8bit | memory |
| Target modules | all-linear | — |
| Max seq length | 4096 | matches data prep |
| Seed | 7 | all runs; report seed sensitivity ± |

Config validated by `training_config.py::QLoRAConfig.validate()`.

## 5. Hardware runbook

1. Provision a **single 24GB+ CUDA GPU** (RTX 4090 / A100 40GB class) on
   RunPod or Vast.ai. Check current spot pricing at run time — do not
   trust old numbers.
2. `git clone` the repo at the commit recorded in the experiment log;
   `cd research && uv sync --extra train`.
3. Prepare data:
   ```
   uv run python -m sanvada_research.prepare \
     --input datasets/selection-v1/<tier>.jsonl \
     --train-out training/sft-train.jsonl \
     --val-out training/sft-val.jsonl \
     --test-out training/sft-test.jsonl \
     --split-by user --seed 7
   ```
   (`prepare` must enforce the by-user split; extend it if needed — with tests.)
4. Train:
   ```
   uv run python -m sanvada_research.train \
     --base-model Qwen/Qwen3-4B-Instruct-2507 \
     --train-data training/sft-train.jsonl \
     --val-data training/sft-val.jsonl \
     --output-dir training/adapters/qwen3-4b-sel-v1 \
     --r 16 --alpha 32 --lr 2e-4 --epochs 2 --seed 7
   ```
5. Log to the append-only experiment tracker (`experiments.py`): config
   hash, data hash, adapter hash, val loss curve, seed, GPU type, cost.
6. **Temperature scaling** for calibration: fit temperature T on the val
   split (minimize NLL over choice probabilities), freeze it, report ECE
   before/after.

## 6. Evaluation protocol (the thesis numbers)

On the **held-out test split** (by user, §2), report for each system:

- **hit@1**, **MRR** (primary)
- **Brier score**, **ECE** over choice probabilities (calibration)
- 95% CIs via bootstrap; significance via paired permutation test

Systems compared (all on identical test cases):

| System | `modelVersion` | What it is |
|---|---|---|
| heuristic | `heuristic-1.0.0` | deterministic baseline, must-be-beaten bar |
| base zero-shot | `qwen3-4b-base` | the base model, no fine-tune (ablation: what did SFT buy?) |
| prompted general | `gateway-1.0.0` | GPT-4o-mini prompted — "sin mi API" |
| **fine-tuned (ours)** | `qwen-ft-1` | the thesis model — "con mi API" |

**Acceptance criteria** (all must hold on Tier 2, or Tier 1 if Tier 2 < 200 decisions):
1. `hit@1(fine-tuned) > hit@1(prompted general)`, p < 0.05.
2. `ECE(fine-tuned) ≤ ECE(prompted general)` — we do not trade accuracy for bluffing.
3. `hit@1(fine-tuned) > hit@1(base zero-shot)` — the gain is from user data, not the base model.
4. UQ reported: `hit@1 / test–retest ceiling` where the ceiling is measured
   (§10 of UNDERSTANDING.md); if unmeasured, report raw hit@1 and mark UQ estimated.

## 7. Registration (after acceptance)

New implementation behind the existing contract — no app changes:

```ts
// src/infrastructure/llm/selection-model.ts
export class QwenSelectionModel implements ExperienceSelectionModel {
  readonly modelVersion = "qwen-ft-1";
  // loads the adapter (local path or hosted inference endpoint)
}
```

Register in `resolveSelectionModel()`: `SELECTION_MODEL=qwen-ft-1`.
The benchmark (`evaluateSelection`) decides; the API reports
`selectionModelVersion` so builders see which model answered.

## 8. What NOT to do

- Never train on the test split. Never tune hyperparameters on it either —
  val is for tuning, test is for the paper.
- Never report Tier 0 numbers as understanding. They validate plumbing.
- Never ship the adapter without the experiment log entry (config hash,
  data hash, adapter hash, eval report).
- If the fine-tuned model fails acceptance: report it. A negative result
  with clean methodology is still a thesis result.
