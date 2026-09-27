-- ============================================================================
-- 003_human_context.sql — Phase 1 (PLAN §§9–13)
-- The core chain: Evidence → Claim → ClaimVersion → HumanContextSnapshot.
-- There is deliberately NO single human_context table with everything.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- evidence (PLAN §9): immutable. If interpretation changes, the evidence remains.
-- Only relevance_status may change after insert (the async pipeline moves
-- pending → relevant/irrelevant → processed).
-- ----------------------------------------------------------------------------
create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  source_type text not null check (
    source_type in (
      'conversation', 'experience_report', 'assessment',
      'user_confirmation', 'user_correction', 'system_observation'
    )
  ),
  source_id uuid,
  content text not null,
  structured_data jsonb,
  relevance_status text not null default 'pending' check (
    relevance_status in ('pending', 'relevant', 'irrelevant', 'processed')
  ),
  created_at timestamptz not null default now()
);

create index evidence_user_id_idx on public.evidence(user_id);
create index evidence_user_id_status_idx
  on public.evidence(user_id, relevance_status);

create or replace function public.prevent_evidence_content_mutation()
returns trigger
language plpgsql
as $$
begin
  if old.user_id is distinct from new.user_id
     or old.source_type is distinct from new.source_type
     or old.source_id is distinct from new.source_id
     or old.content is distinct from new.content
     or old.structured_data is distinct from new.structured_data
     or old.created_at is distinct from new.created_at then
    raise exception 'evidence is immutable: only relevance_status may change';
  end if;
  return new;
end;
$$;

create trigger evidence_immutable
  before update on public.evidence
  for each row execute function public.prevent_evidence_content_mutation();

-- ----------------------------------------------------------------------------
-- claims (PLAN §10): enduring propositions about the user.
-- ----------------------------------------------------------------------------
create table public.claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category text not null check (
    category in (
      'personality', 'preference', 'value', 'interest', 'experience',
      'capability', 'behavior_pattern', 'emotional_pattern',
      'social_pattern', 'uncertainty'
    )
  ),
  current_status text not null default 'observed' check (
    current_status in (
      'observed', 'inferred', 'user_confirmed',
      'user_rejected', 'contradicted', 'outdated'
    )
  ),
  current_confidence double precision not null default 0 check (
    current_confidence >= 0 and current_confidence <= 1
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index claims_user_id_idx on public.claims(user_id);
create index claims_user_id_category_idx on public.claims(user_id, category);

create trigger claims_updated_at
  before update on public.claims
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- claim_versions (PLAN §11): historical interpretations are NEVER overwritten.
-- Every meaningful interpretation change creates a new version.
-- ----------------------------------------------------------------------------
create table public.claim_versions (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  claim_text text not null,
  status text not null check (
    status in (
      'observed', 'inferred', 'user_confirmed',
      'user_rejected', 'contradicted', 'outdated'
    )
  ),
  confidence double precision not null check (
    confidence >= 0 and confidence <= 1
  ),
  reason text,
  created_at timestamptz not null default now(),
  supersedes_version_id uuid references public.claim_versions(id) on delete set null
);

create index claim_versions_claim_id_idx on public.claim_versions(claim_id);
create index claim_versions_claim_id_created_at_idx
  on public.claim_versions(claim_id, created_at desc);

-- ----------------------------------------------------------------------------
-- claim_evidence (PLAN §12): many-to-many. Answers "why do you think this
-- about me?" via supports / contradicts / qualifies.
-- ----------------------------------------------------------------------------
create table public.claim_evidence (
  claim_id uuid not null references public.claims(id) on delete cascade,
  evidence_id uuid not null references public.evidence(id) on delete cascade,
  relationship text not null check (
    relationship in ('supports', 'contradicts', 'qualifies')
  ),
  created_at timestamptz not null default now(),
  primary key (claim_id, evidence_id, relationship)
);

create index claim_evidence_evidence_id_idx on public.claim_evidence(evidence_id);

-- ----------------------------------------------------------------------------
-- human_context_snapshots (PLAN §13): references/versions claims, never an
-- uncontrolled duplicate database.
-- ----------------------------------------------------------------------------
create table public.human_context_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  version integer not null,
  snapshot_data jsonb not null default '{"claimVersions": []}',
  created_at timestamptz not null default now(),
  trigger text not null check (
    trigger in ('major_update', 'experience', 'user_review', 'scheduled', 'manual')
  ),
  unique (user_id, version)
);

create index human_context_snapshots_user_id_idx
  on public.human_context_snapshots(user_id);

-- ----------------------------------------------------------------------------
-- RLS: everything here is user-scoped. Child tables inherit ownership through
-- their parents via EXISTS checks.
-- ----------------------------------------------------------------------------
alter table public.evidence enable row level security;
alter table public.claims enable row level security;
alter table public.claim_versions enable row level security;
alter table public.claim_evidence enable row level security;
alter table public.human_context_snapshots enable row level security;

create policy "evidence_all_own" on public.evidence
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "claims_all_own" on public.claims
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "claim_versions_all_own" on public.claim_versions
  for all
  using (
    exists (
      select 1 from public.claims c
      where c.id = claim_versions.claim_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.claims c
      where c.id = claim_versions.claim_id and c.user_id = auth.uid()
    )
  );

create policy "claim_evidence_all_own" on public.claim_evidence
  for all
  using (
    exists (
      select 1 from public.claims c
      where c.id = claim_evidence.claim_id and c.user_id = auth.uid()
    )
    and exists (
      select 1 from public.evidence e
      where e.id = claim_evidence.evidence_id and e.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.claims c
      where c.id = claim_evidence.claim_id and c.user_id = auth.uid()
    )
    and exists (
      select 1 from public.evidence e
      where e.id = claim_evidence.evidence_id and e.user_id = auth.uid()
    )
  );

create policy "human_context_snapshots_all_own" on public.human_context_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
