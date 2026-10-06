# Sanvada

> "This AI is progressively getting to know me."

Sanvada is a **thesis on machine understanding of the human user** — a
pipeline that turns raw user interaction into a calibrated, versioned
model of a specific person, and a metric for how well it works.
The consumer app is the demo vehicle; the product is the pipeline and,
eventually, an API that lets *other* builders' agents understand *their*
users better.

**The metric:** per-user selection accuracy — hit@1/MRR on held-out user
decisions — normalized by the user's own self-agreement into the
**Understanding Quotient (UQ)**. UQ = 1 is telekinesis. The API is sold
on ΔUQ: *sin mi API vs con mi API*, measured on the builder's own data.
Full framing: [`docs/UNDERSTANDING.md`](docs/UNDERSTANDING.md).

## What it is / what it is not

- Human Context is **structured data**, not one giant prompt; Postgres is the source of truth. Historical interpretations are versioned, never silently erased. Contradictions are preserved as legitimate information.
- The user **owns and controls** their representation. No artificial personality or mental-health scores. No diagnosis. No cross-user learning without opt-in.
- Not analytics (PostHog), not agent observability (Langfuse), not memory infra (Mem0): Sanvada predicts the user's next choice and proves it.
- Research LLM work (Python/Unsloth) is separated from the production app, which intentionally avoids Python, FastAPI, LangGraph, and a VPS.

## Status

- **Fases 0–16 done (2026-09-27):** SCREAM app, Supabase migrations 001–007, Human Context, Memory, Mind, Companion, Development, Experiences, Sentient UI, research infra, benchmark harness, QLoRA prep, production selection model behind contract, A/B evaluation, hardening, thesis.
- **2026-10-06 — thesis reframed:** `docs/UNDERSTANDING.md` (UQ metric, sin/con API protocol, related work). **API v1 live:** `POST /api/v1/ingest`, `/understand`, `/select` + TS client (`src/api-client/`) — see `docs/API.md`. **Training spec frozen:** `research/training/SELECTION_MODEL_TRAINING.md` (GPU run pending).
- **Blocked on Roger:** Supabase project + apply migrations + 2-user isolation test + `supabase gen types`; GPU worker for benchmark + fine-tuning runs.

## API v1 (integrable)

```bash
SANVADA_API_KEY=tu-clave npm run start
```

```ts
import { SanvadaClient } from "./src/api-client/sanvada-client.js";
const sanvada = new SanvadaClient({ baseUrl: "https://tu-sanvada.com", apiKey: process.env.SANVADA_API_KEY! });
await sanvada.ingest("user-123", [{ sourceType: "conversation", content: "prefiero sesiones cortas" }]);
const { selections } = await sanvada.select("user-123", [
  { experienceId: "tour-corto", fit: 0.8, novelty: 0.6, risk: "low" },
]);
```

See [`docs/API.md`](docs/API.md).

## Stack

Next.js 16.3.6 · TypeScript (strict) · React 19 · Vercel AI SDK 7 · AI Elements · Biome · Zod 4 · Tailwind v4 · Supabase (Postgres + Auth + Storage + RLS) · Supermemory (semantic retrieval — never the source of truth) · Vitest

## Quickstart

```bash
cp .env.example .env.local   # fill in as phases land
npm install --legacy-peer-deps  # npm 10.9.4 arborist workaround
npm run dev
```

| command | what |
|---|---|
| `npm test` | Vitest: unit + contract + boundary tests |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | `biome check .` |
| `npm run build` | production build |

## Structure

```
src/
├── app/               # routes: (auth), chat, self-map, experiences, evolution, settings, api/v1
├── api-client/        # SanvadaClient — integrable TS client for API v1
├── domains/           # human-context, experiences, development, conversations, safety, users
├── application/      # mind, companion, development, experience-selection, understanding
├── infrastructure/   # database, memory, llm, auth, notifications, observability, security
├── ui/               # chat, sentient, human-context, experiences, evolution
└── shared/           # schemas (Zod), errors, types, utils
research/             # datasets, generation, training, evaluation, experiments, analysis
supabase/             # SQL migrations
docs/
├── UNDERSTANDING.md  # the thesis: UQ metric, sin/con API protocol, related work
├── API.md            # API v1 integration guide
└── thesis/           # Phase 16 research summary
```

Business/domain logic never depends on UI, database implementation, model provider, or AI framework. Zod is a first-class contract layer across every boundary (enforced by `tests/architecture-boundaries.test.ts`).

## License

MIT — see [LICENSE](LICENSE).
