-- ============================================================================
-- 005_experiences.sql — Phase 1 (PLAN §§16–19)
-- Catalog → recommendation → attempt → report. No difficulty field.
-- The experiences catalog is shared (not user-scoped); everything else is.
-- ============================================================================

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  objective text,
  target_capabilities text[] not null default '{}',
  context text,
  social_requirement text,
  emotional_intensity double precision check (
    emotional_intensity is null
    or (emotional_intensity >= 0 and emotional_intensity <= 1)
  ),
  risk text not null default 'low' check (risk in ('low', 'medium', 'high')),
  prerequisites text[] not null default '{}',
  estimated_duration text,
  constraints text[] not null default '{}',
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger experiences_updated_at
  before update on public.experiences
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- experience_recommendations (PLAN §17): reproducibility —
-- "why was this exact experience recommended at this exact time?"
-- agent_run_id FK is added in 006_observability.sql (agent_runs).
-- ----------------------------------------------------------------------------
create table public.experience_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  experience_id uuid not null references public.experiences(id) on delete restrict,
  agent_run_id uuid not null,
  context_snapshot_id uuid not null references public.human_context_snapshots(id) on delete restrict,
  reason text not null,
  fit double precision not null check (fit >= 0 and fit <= 1),
  risk text not null check (risk in ('low', 'medium', 'high')),
  confidence double precision not null check (confidence >= 0 and confidence <= 1),
  status text not null default 'proposed' check (
    status in ('proposed', 'accepted', 'rejected', 'expired')
  ),
  created_at timestamptz not null default now()
);

create index experience_recommendations_user_id_idx
  on public.experience_recommendations(user_id);
create index experience_recommendations_experience_id_idx
  on public.experience_recommendations(experience_id);

create table public.experience_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  experience_id uuid not null references public.experiences(id) on delete restrict,
  recommendation_id uuid references public.experience_recommendations(id) on delete set null,
  status text not null default 'started' check (
    status in ('started', 'completed', 'abandoned')
  ),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  check (completed_at is null or started_at is null or completed_at >= started_at)
);

create index experience_attempts_user_id_idx on public.experience_attempts(user_id);
create index experience_attempts_experience_id_idx
  on public.experience_attempts(experience_id);

-- ----------------------------------------------------------------------------
-- experience_reports (PLAN §19): the report becomes evidence →
-- Human Context Engine.
-- ----------------------------------------------------------------------------
create table public.experience_reports (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.experience_attempts(id) on delete cascade,
  content text not null,
  structured_reflection jsonb,
  created_at timestamptz not null default now()
);

create index experience_reports_attempt_id_idx
  on public.experience_reports(attempt_id);

-- ----------------------------------------------------------------------------
-- RLS
-- The shared catalog is readable by any authenticated user; only the
-- service role (bypasses RLS) can write it.
-- ----------------------------------------------------------------------------
alter table public.experiences enable row level security;
alter table public.experience_recommendations enable row level security;
alter table public.experience_attempts enable row level security;
alter table public.experience_reports enable row level security;

create policy "experiences_select_authenticated" on public.experiences
  for select to authenticated using (true);

create policy "experience_recommendations_all_own"
  on public.experience_recommendations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "experience_attempts_all_own" on public.experience_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "experience_reports_all_own" on public.experience_reports
  for all
  using (
    exists (
      select 1 from public.experience_attempts a
      where a.id = experience_reports.attempt_id and a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.experience_attempts a
      where a.id = experience_reports.attempt_id and a.user_id = auth.uid()
    )
  );
