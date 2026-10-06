# Sanvada API v1 — integration guide

The understanding pipeline as an integrable API. Your product sends user
events; Sanvada returns a calibrated user model and ranked selections.
Read the why first: [`docs/UNDERSTANDING.md`](UNDERSTANDING.md).

## Setup

```bash
# server
SANVADA_API_KEY=tu-clave-secreta npm run start
```

Every request carries the key:

```
x-api-key: tu-clave-secreta
```

Rate limit: 60 req/min per key (in-memory; Redis for multi-instance).

## The three calls

### 1. INGEST — `POST /api/v1/ingest`

Append user events as immutable evidence. Call it whenever something
worth remembering happens in your product: a message, a choice, a
correction, an outcome.

```json
{
  "userId": "user-123",
  "events": [
    { "sourceType": "conversation", "content": "prefiero sesiones cortas por la mañana" },
    { "sourceType": "user_correction", "content": "no me gustan los recordatorios por la noche" }
  ]
}
```

`sourceType`: `conversation` · `experience_report` · `assessment` ·
`user_confirmation` · `user_correction` · `system_observation`.
Up to 100 events per call. → `{ userId, count, evidenceIds }`.

### 2. MODEL — `POST /api/v1/understand`

```json
{ "userId": "user-123" }
```

→ `{ userId, modelVersion, claims: [{ id, category, text, confidence, status, evidenceCount, updatedAt }] }`

v1 runs `understand-heuristic-0.1.0` (scaffold: one low-confidence
claim per evidence source). The fine-tuned extractor registers behind
the same contract later — your integration does not change.

### 3. SELECT — `POST /api/v1/select`

```json
{
  "userId": "user-123",
  "objectiveId": "onboarding",
  "candidates": [
    { "experienceId": "tour-corto", "fit": 0.8, "novelty": 0.6, "risk": "low" },
    { "experienceId": "tour-largo", "fit": 0.5, "novelty": 0.9, "risk": "medium" }
  ]
}
```

→ `{ understandModelVersion, selectionModelVersion, contextSnapshotId, selections: [{ experienceId, score, rationale, modelVersion, inputHash }] }`,
ranked best-first. `inputHash` makes every ranking reproducible and
auditable.

## TypeScript client

```ts
import { SanvadaClient } from "./src/api-client/sanvada-client.js";

const sanvada = new SanvadaClient({
  baseUrl: "https://tu-sanvada.com",
  apiKey: process.env.SANVADA_API_KEY!,
});

await sanvada.ingest("user-123", [
  { sourceType: "conversation", content: "prefiero sesiones cortas" },
]);

const { selections } = await sanvada.select("user-123", [
  { experienceId: "tour-corto", fit: 0.8, novelty: 0.6, risk: "low" },
  { experienceId: "tour-largo", fit: 0.5, novelty: 0.9, risk: "medium" },
]);

console.log(selections[0].experienceId); // the system's best pick
```

## The sin/con API protocol (your sales demo)

This is how you measure ΔUQ on your own data
(`docs/UNDERSTANDING.md` §4):

1. Collect K held-out decisions: user U chose A from {A, B, C…}.
2. Rank the candidates with your current approach → hit@1, MRR.
3. `ingest` U's history, then `select` the same candidates → hit@1, MRR.
4. Compare. The delta is what the API sells.

## Errors

| Status | Meaning |
|---|---|
| 401 | missing/invalid `x-api-key` |
| 400 | body failed Zod validation (message explains the shape) |
| 429 | rate limited — `retry-after` seconds |
| 503 | `SANVADA_API_KEY` not set on the server |

## Honest limits of v1

- Storage is in-memory: one process, no persistence across restarts.
  The Supabase implementation replaces it behind the same port.
- `understand` is a heuristic scaffold, not a trained extractor.
- `select` defaults to the deterministic heuristic; set
  `SELECTION_MODEL=gateway` + `AI_GATEWAY_API_KEY` for the LLM ranker.
- No cross-user learning, ever, without explicit opt-in.
