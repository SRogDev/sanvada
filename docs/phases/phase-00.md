# Phase 0 — Repository & Architecture (2026-09-27)

## Deliverables (PLAN §50)

- [x] project: Next.js 16.3.6 + React 19 + TypeScript (strict) + App Router
- [x] dependency setup: `ai` (Vercel AI SDK 7), `zod` 4, `@supabase/ssr`,
      `@supabase/supabase-js`, `vitest`, `@biomejs/biome`, Tailwind v4
- [x] architecture directories: SCREAM layout —
      `src/app|domains|application|infrastructure|ui|shared` + `research/`
- [x] Biome: format + lint + organize-imports, `biome check` in `npm run lint`
- [x] Zod: first-class contract layer (`src/shared/schemas/`)
- [x] test framework: Vitest (`tests/`, `npm test`)
- [x] environment schema: `src/shared/schemas/env.ts` (Zod, all optional
      until their phase lands) + `.env.example`
- [x] documentation: `README.md`, `PLAN.md` (source of truth),
      `docs/architecture-decisions.md`, this log

## Tests (TDD: RED → GREEN, witnessed)

| file | covers |
|---|---|
| `tests/env.test.ts` | env schema: empty parses, full parses, bad URL rejected |
| `tests/contracts.test.ts` | `ExperienceSelectionSchema`: valid parses; fit/confidence bounds, risk enum, UUID enforced |
| `tests/architecture-boundaries.test.ts` | domain layer imports zero forbidden deps (next/react/supabase/ai-sdk/supermemory/infrastructure) |

RED confirmed before implementation (3 files failed on missing modules);
GREEN after: **9/9 passing**.

## Acceptance (PLAN §50)

- [x] `npm run build` — clean
- [x] `npm test` — 9/9 pass
- [x] `npm run lint` (biome) — clean
- [x] `npm run typecheck` (tsc --noEmit, strict) — clean

## Notes

- Fresh public repo `SRogDev/sanvada`; first commit seeded via Contents API,
  full tree pushed via `push_repo.py` (API-based, no git credentials on VM).
- npm 10.9.4 arborist bug → installs use `--legacy-peer-deps` (ADR-006).
- Domain layer currently types-only (PLAN §§6–19); logic lands in Phase 2.
  Application/infrastructure/ui are documented placeholders with their
  contracts noted; wiring lands in Phases 1, 4–9.
