# Sanvada

> “This AI is progressively getting to know me.”

Sanvada is a conversational AI system that progressively constructs a
longitudinal, contextualized representation of a person — **Human Context** —
and uses it to personalize conversations, development decisions, and
real-world experiences.

The central product loop:

```
PERSON → INTERACTION → EVIDENCE → HUMAN CONTEXT → PERSONALIZED UNDERSTANDING
  → AGENT DECISION → EXPERIENCE → REAL-WORLD OUTCOME → NEW EVIDENCE ↺
```

## Implementation source of truth

**[`PLAN.md`](PLAN.md)** — the master implementation plan. It defines the
architecture, domain model, contracts, testing strategy, ML pipeline,
research infrastructure, and deployment strategy, phase by phase
(Phases 0–16). Follow it unless an explicit architectural conflict is
discovered (then use the Architectural Change Protocol, PLAN §52).

## Stack

| Layer | Choice |
|---|---|
| App | Next.js 16, TypeScript (strict), React 19, Vercel AI SDK 7, AI Elements / Sentient UI, PWA, Biome, Zod |
| Data | Supabase (Postgres + Auth + Storage), Row Level Security |
| Memory | Supermemory (semantic retrieval — never the source of truth) |
| Research | Python, PyTorch, HF ecosystem, Unsloth; Qwen small models as initial candidates |

## Architecture — SCREAM

```
src/
├── app/               # routes: (auth), chat, self-map, experiences, evolution, settings
├── domains/           # human-context, experiences, development, conversations, safety, users
├── application/       # mind, companion, development, experience-selection
├── infrastructure/    # database, memory, llm, auth, notifications, observability
├── ui/                # chat, sentient, human-context, experiences, evolution
└── shared/            # schemas (Zod), errors, types, utils
research/              # datasets, generation, training, evaluation, experiments, analysis
supabase/              # SQL migrations (Phase 1)
```

Business/domain logic never depends on UI, database implementation, model
provider, or AI framework. Zod is a first-class contract layer across every
boundary (PLAN §5). Enforced by `tests/architecture-boundaries.test.ts`.

## Key principles

- Human Context is **longitudinal**; historical interpretations are **never
  silently erased** (claim versioning).
- Contradictions are legitimate information, preserved — not deleted.
- The user **owns and controls** their representation.
- No artificial personality/mental-health score. No diagnosis.
- Human Context is **structured data**, not one giant prompt; Postgres is the
  source of truth.
- The custom-trained model is **only** the Experience Selection Model.
- Research infrastructure is separated from production infrastructure.

## Quickstart

```bash
cp .env.example .env.local   # fill in as phases land
npm install --legacy-peer-deps  # npm 10.9.4 arborist workaround (see docs/architecture-decisions.md)
npm run dev
```

| command | what |
|---|---|
| `npm test` | Vitest: unit + contract + boundary tests |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | `biome check .` |
| `npm run build` | production build |

## Phase status

- [x] **Phase 0** — Repository & Architecture (`docs/phases/phase-00.md`)
- [ ] **Phase 1** — Supabase: Auth, migrations, RLS
- [ ] **Phase 2** — Domain Layer
- [ ] **Phase 3** — Human Context Engine
- [ ] …through Phase 16 (see `PLAN.md` §50)

## License

TBD — Roger's decision.
