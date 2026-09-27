# Supabase

Migrations for **Phase 1** (PLAN §§7–23). Run in order: `001` → `007`.

| file | contents (PLAN refs) |
|---|---|
| `001_core_identity.sql` | `users`, `profiles`, `handle_updated_at()` (§§7.1–7.2) |
| `002_conversations.sql` | `conversations`, `messages` (§8) |
| `003_human_context.sql` | `evidence` (+ immutability trigger), `claims`, `claim_versions`, `claim_evidence`, `human_context_snapshots` (§§9–13) |
| `004_development.sql` | `objectives`, `development_plans`, `development_plan_items` (§§14–15) |
| `005_experiences.sql` | `experiences` (shared catalog), `experience_recommendations`, `experience_attempts`, `experience_reports` (§§16–19) |
| `006_observability.sql` | `agent_runs`, `safety_events`, `model_versions`, `prompt_versions` (§§20–22) |
| `007_research.sql` | `research_runs`, `evaluation_cases`, `evaluation_results`, `model_evaluations` — RLS deny-all, service role only (§23) |

Every user table has RLS enabled with `auth.uid()`-scoped policies.
Child tables (`messages`, `claim_versions`, `claim_evidence`, …) inherit
ownership through `EXISTS` checks on their parents. Research tables have
RLS enabled with **no policies** — only the service role can touch them.

## How to apply

**Option A — Dashboard (simplest):** Supabase Dashboard → SQL Editor → paste
each file in order → Run.

**Option B — CLI:**
```bash
supabase link --project-ref <ref>
supabase db push   # supabase/migrations is picked up automatically
```

After applying, generate typed clients:
```bash
supabase gen types typescript --linked > src/infrastructure/database/types.ts
```
then wire the `Database` generic into `client.ts`.

## RLS acceptance test (Phase 1 gate)

Run once against the live project, with two authenticated users A and B:

```sql
-- as A: insert a claim; as B: it must be invisible and uninsertable
-- (use a second authenticated client, not raw SQL)
select * from claims;                             -- expect: zero rows (A's claims hidden)
insert into claims (user_id, category)            -- expect: RLS violation
  values ('<A-uuid>', 'preference');
```

Expected: B sees nothing of A's, B cannot write as A, and the shared
`experiences` catalog remains readable by both. Record the result in
`docs/phases/phase-01.md`.
