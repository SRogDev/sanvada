-- ============================================================================
-- 004_development.sql — Phase 1 (PLAN §§14–15)
-- Objectives + development plans. NOT a habit tracker.
-- ============================================================================

create table public.objectives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'active' check (
    status in ('active', 'paused', 'completed', 'archived')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index objectives_user_id_idx on public.objectives(user_id);

create trigger objectives_updated_at
  before update on public.objectives
  for each row execute function public.handle_updated_at();

create table public.development_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  summary text,
  status text not null default 'active' check (
    status in ('active', 'paused', 'completed', 'archived')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index development_plans_user_id_idx on public.development_plans(user_id);

create trigger development_plans_updated_at
  before update on public.development_plans
  for each row execute function public.handle_updated_at();

create table public.development_plan_items (
  id uuid primary key default gen_random_uuid(),
  development_plan_id uuid not null references public.development_plans(id) on delete cascade,
  objective_id uuid references public.objectives(id) on delete set null,
  description text not null,
  priority integer not null default 0,
  status text not null default 'proposed' check (
    status in ('proposed', 'active', 'completed', 'dropped')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index development_plan_items_plan_id_idx
  on public.development_plan_items(development_plan_id);
create index development_plan_items_objective_id_idx
  on public.development_plan_items(objective_id);

create trigger development_plan_items_updated_at
  before update on public.development_plan_items
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.objectives enable row level security;
alter table public.development_plans enable row level security;
alter table public.development_plan_items enable row level security;

create policy "objectives_all_own" on public.objectives
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "development_plans_all_own" on public.development_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "development_plan_items_all_own" on public.development_plan_items
  for all
  using (
    exists (
      select 1 from public.development_plans p
      where p.id = development_plan_items.development_plan_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.development_plans p
      where p.id = development_plan_items.development_plan_id
        and p.user_id = auth.uid()
    )
  );
