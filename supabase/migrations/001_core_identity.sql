-- ============================================================================
-- 001_core_identity.sql — Phase 1 (PLAN §§7.1–7.2)
-- Application identity. Auth identity stays compatible with Supabase Auth.
-- Human Context NEVER lives in profiles.
-- ============================================================================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

create table public.profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  locale text,
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- RLS: a user can only access their own identity rows.
-- ----------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.profiles enable row level security;

create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

create policy "users_insert_own" on public.users
  for insert with check (auth.uid() = id);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles_all_own" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
