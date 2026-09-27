-- ============================================================================
-- 007_research.sql — Phase 1 (PLAN §23)
-- Research data stays LOGICALLY SEPARATE. Production tables never depend on
-- research tables (no FKs point here from production tables).
--
-- RLS is enabled with NO policies: only the service role (which bypasses
-- RLS) can read/write. Research access is server-side only.
-- ============================================================================

create table public.research_runs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  purpose text,
  config jsonb,
  status text not null default 'running' check (
    status in ('running', 'completed', 'failed')
  ),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.evaluation_cases (
  id uuid primary key default gen_random_uuid(),
  dataset_version text not null,
  input jsonb not null,
  expected jsonb not null,
  created_at timestamptz not null default now()
);

create index evaluation_cases_dataset_version_idx
  on public.evaluation_cases(dataset_version);

create table public.evaluation_results (
  id uuid primary key default gen_random_uuid(),
  research_run_id uuid not null references public.research_runs(id) on delete cascade,
  evaluation_case_id uuid not null references public.evaluation_cases(id) on delete restrict,
  output jsonb,
  scores jsonb,
  created_at timestamptz not null default now()
);

create index evaluation_results_research_run_id_idx
  on public.evaluation_results(research_run_id);

create table public.model_evaluations (
  id uuid primary key default gen_random_uuid(),
  research_run_id uuid not null references public.research_runs(id) on delete cascade,
  model_name text not null,
  metrics jsonb,
  notes text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- RLS: deny-all for anon/authenticated (no policies). Service role only.
-- ----------------------------------------------------------------------------
alter table public.research_runs enable row level security;
alter table public.evaluation_cases enable row level security;
alter table public.evaluation_results enable row level security;
alter table public.model_evaluations enable row level security;
