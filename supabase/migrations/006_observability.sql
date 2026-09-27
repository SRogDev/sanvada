-- ============================================================================
-- 006_observability.sql — Phase 1 (PLAN §§20–22)
-- agent_runs is the central observability record AND part of research
-- reproducibility. model_versions / prompt_versions: never let important
-- research runs depend on an unversioned prompt.
-- ============================================================================

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  agent_type text not null check (
    agent_type in (
      'mind', 'companion', 'development', 'experience',
      'human_context', 'safety'
    )
  ),
  conversation_id uuid references public.conversations(id) on delete set null,
  model text,
  model_version text,
  prompt_version text,
  context_snapshot_id uuid references public.human_context_snapshots(id) on delete set null,
  input_metadata jsonb,
  output_metadata jsonb,
  status text not null default 'running' check (
    status in ('running', 'completed', 'failed')
  ),
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  estimated_cost numeric(12, 6) check (estimated_cost is null or estimated_cost >= 0),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index agent_runs_user_id_idx on public.agent_runs(user_id);
create index agent_runs_user_id_created_at_idx
  on public.agent_runs(user_id, created_at desc);

-- Back-reference from 005: every recommendation is tied to the run that made it.
alter table public.experience_recommendations
  add constraint experience_recommendations_agent_run_id_fkey
  foreign key (agent_run_id) references public.agent_runs(id) on delete restrict;

-- ----------------------------------------------------------------------------
-- safety_events (PLAN §21): no unnecessary sensitive content stored.
-- ----------------------------------------------------------------------------
create table public.safety_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  agent_run_id uuid references public.agent_runs(id) on delete set null,
  category text not null,
  severity text not null check (
    severity in ('low', 'medium', 'high', 'critical')
  ),
  action text not null check (
    action in (
      'continue', 'soft_caution', 'redirect',
      'professional_support', 'block_experience'
    )
  ),
  created_at timestamptz not null default now()
);

create index safety_events_user_id_idx on public.safety_events(user_id);

-- ----------------------------------------------------------------------------
-- model_versions / prompt_versions (PLAN §22): global registries.
-- Readable by authenticated users; writable by service role only.
-- ----------------------------------------------------------------------------
create table public.model_versions (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  model_name text not null,
  version text not null,
  purpose text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  unique (provider, model_name, version)
);

create table public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  agent_type text not null check (
    agent_type in (
      'mind', 'companion', 'development', 'experience',
      'human_context', 'safety'
    )
  ),
  version text not null,
  template text not null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  unique (agent_type, version)
);

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.agent_runs enable row level security;
alter table public.safety_events enable row level security;
alter table public.model_versions enable row level security;
alter table public.prompt_versions enable row level security;

create policy "agent_runs_all_own" on public.agent_runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "safety_events_all_own" on public.safety_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "model_versions_select_authenticated" on public.model_versions
  for select to authenticated using (true);

create policy "prompt_versions_select_authenticated" on public.prompt_versions
  for select to authenticated using (true);
