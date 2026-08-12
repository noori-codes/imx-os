-- Phase 7: Focus / Pomodoro sessions
-- Run in Supabase SQL Editor after 003_habits.sql

create table public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mode text not null check (mode in ('focus', 'short_break', 'long_break')),
  planned_seconds integer not null check (planned_seconds > 0),
  actual_seconds integer not null check (actual_seconds >= 0),
  completed boolean not null default false,
  note text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index focus_sessions_user_id_idx on public.focus_sessions (user_id);
create index focus_sessions_user_id_started_at_idx
  on public.focus_sessions (user_id, started_at desc);

alter table public.focus_sessions enable row level security;

create policy "Users can view own focus sessions"
  on public.focus_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own focus sessions"
  on public.focus_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own focus sessions"
  on public.focus_sessions for delete
  using (auth.uid() = user_id);
