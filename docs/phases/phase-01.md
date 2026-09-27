# Phase 1 — Supabase (2026-09-27)

## Deliverables (PLAN §50)

- [x] Auth: Supabase Auth integration — `public.users.id` references
      `auth.users(id)`; browser + server client factories in
      `src/infrastructure/database/client.ts` (cookie-based sessions,
      service-role key never touches the client)
- [x] migrations: `supabase/migrations/001` → `007`, applied in order
- [x] tables: all of PLAN §§7–23 (users, profiles, conversations, messages,
      evidence, claims, claim_versions, claim_evidence,
      human_context_snapshots, objectives, development_plans,
      development_plan_items, experiences, experience_recommendations,
      experience_attempts, experience_reports, agent_runs, safety_events,
      model_versions, prompt_versions + 4 research tables)
- [x] indexes: FK columns + (`user_id`, `created_at`) access patterns
- [x] FK: full referential graph; `agent_run_id` back-reference added in 006
- [x] constraints: check constraints for every plan enum (roles, statuses,
      categories, risk, severity, actions); confidence/fit in [0,1];
      `attempts.completed_at >= started_at`; unique `(user_id, version)` on
      snapshots; unique `(provider, model_name, version)` / `(agent_type, version)`
- [x] RLS: enabled on every table. User tables scoped by `auth.uid()`;
      child tables inherit ownership via `EXISTS` on parents; shared catalog
      (`experiences`, `model_versions`, `prompt_versions`) is select-only for
      authenticated; research tables are deny-all (service role only)
- [x] plan-principle enforcement in SQL: `evidence` is immutable except
      `relevance_status` (trigger `prevent_evidence_content_mutation`)

## Verification

- SQL syntax: all 7 files parse with libpg_query (`pgpp`) — 7/7 OK.
- `tests/database-client.test.ts`: 2 tests — fails fast with `ValidationError`
  when env is missing; creates a client when configured. (Small local unit:
  written inline and verified, per gentle-ai ODD routing.)
- Full suite: `tsc` clean, `biome check` clean, `vitest` 11/11, `next build` green.

## Acceptance (PLAN §50): user can only access own data

- [x] Enforced by construction: every user-table policy is `auth.uid()`-scoped.
- [ ] **Live two-user isolation test** — pending the real Supabase project
      (procedure in `supabase/README.md`). Run once, record result here.

## Notes

- Migrations are written as if the project already exists (per Roger's call);
  applying them is one step in the Supabase dashboard / CLI.
- Typed `Database` generics land via `supabase gen types` after first apply.
