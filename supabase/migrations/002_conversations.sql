-- ============================================================================
-- 002_conversations.sql — Phase 1 (PLAN §8)
-- Structured Human Context is NEVER stored inside message metadata.
-- ============================================================================

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index conversations_user_id_idx on public.conversations(user_id);
create index conversations_user_id_created_at_idx
  on public.conversations(user_id, created_at desc);

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function public.handle_updated_at();

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index messages_conversation_id_idx on public.messages(conversation_id);
create index messages_conversation_id_created_at_idx
  on public.messages(conversation_id, created_at);

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "conversations_all_own" on public.conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "messages_all_own" on public.messages
  for all
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );
