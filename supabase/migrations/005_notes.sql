-- Phase 8: Notes & journaling
-- Run in Supabase SQL Editor after 004_focus_sessions.sql

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Untitled',
  content text not null default '',
  type text not null default 'note' check (type in ('note', 'journal')),
  journal_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint journal_date_required check (
    (type = 'journal' and journal_date is not null)
    or (type = 'note' and journal_date is null)
  )
);

create unique index notes_user_journal_date_unique
  on public.notes (user_id, journal_date)
  where type = 'journal' and journal_date is not null;

create index notes_user_id_idx on public.notes (user_id);
create index notes_user_id_type_idx on public.notes (user_id, type);
create index notes_user_id_updated_at_idx on public.notes (user_id, updated_at desc);

alter table public.notes enable row level security;

create policy "Users can view own notes"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "Users can insert own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notes"
  on public.notes for update
  using (auth.uid() = user_id);

create policy "Users can delete own notes"
  on public.notes for delete
  using (auth.uid() = user_id);

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();
