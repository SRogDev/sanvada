# STATUS — sanvada

> Single source of truth for where this project stands. Last updated: 2026-10-06.
> Read this before starting work. Update it in the same PR when reality changes.

## Done
- 2026-09-27 — Fases 0–1 done: Next.js 16.3.6 app with SCREAM layout + Zod contract layer (tests green, build green).
- 2026-09-27 — Supabase migrations 001–007: RLS per `auth.uid`, evidence immutability trigger, fail-fast Supabase clients.

## In progress / blocked
- Blocked on Roger: create Supabase project + apply migrations + 2-user isolation test + `supabase gen types`.

## Next
- Fase 2+ per PLAN.md once Supabase is live and the isolation test passes.
