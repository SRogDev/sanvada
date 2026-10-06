# Sanvada

> "This AI is progressively getting to know me."

Sanvada is a conversational AI system that progressively constructs a longitudinal, contextualized representation of a person — **Human Context** — and uses it to personalize conversations, development decisions, and real-world experiences.

## What it is / what it is not

- Human Context is **structured data**, not one giant prompt; Postgres is the source of truth. Historical interpretations are versioned, never silently erased. Contradictions are preserved as legitimate information.
- The user **owns and controls** their representation. No artificial personality or mental-health scores. No diagnosis.
- Research LLM work (Python/Unsloth) is separated from the production app, which intentionally avoids Python, FastAPI, LangGraph, and a VPS.

## Status

- **Fases 0–1 done (2026-09-27):** Next.js 16.3.6 app with SCREAM layout + Zod contract layer (tests green, build green). Supabase migrations 001–007: RLS per `auth.uid`, evidence immutability trigger, fail-fast Supabase clients.
- **Blocked on setup:** create the Supabase project, apply migrations, run the 2-user isolation test, generate Supabase types.
- **Next:** Fase 2+ per `PLAN.md` once Supabase is live.

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
├── app/               # routes: (auth), chat, self-map, experiences, evolution, settings
├── domains/           # human-context, experiences, development, conversations, safety, users
├── application/      # mind, companion, development, experience-selection
├── infrastructure/   # database, memory, llm, auth, notifications, observability
├── ui/               # chat, sentient, human-context, experiences, evolution
└── shared/           # schemas (Zod), errors, types, utils
research/             # datasets, generation, training, evaluation, experiments, analysis
supabase/             # SQL migrations
```

Business/domain logic never depends on UI, database implementation, model provider, or AI framework. Zod is a first-class contract layer across every boundary (enforced by `tests/architecture-boundaries.test.ts`).

## License

MIT — see [LICENSE](LICENSE).
