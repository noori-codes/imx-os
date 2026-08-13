-- Phase 9: Calendar events
-- Run in Supabase SQL Editor after 005_notes.sql
-- Tasks with due_date and journal notes also appear on the calendar.

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  event_date date not null,
  start_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index calendar_events_user_id_idx on public.calendar_events (user_id);
create index calendar_events_user_id_date_idx
  on public.calendar_events (user_id, event_date);

alter table public.calendar_events enable row level security;

create policy "Users can view own calendar events"
  on public.calendar_events for select
  using (auth.uid() = user_id);

create policy "Users can insert own calendar events"
  on public.calendar_events for insert
  with check (auth.uid() = user_id);

create policy "Users can update own calendar events"
  on public.calendar_events for update
  using (auth.uid() = user_id);

create policy "Users can delete own calendar events"
  on public.calendar_events for delete
  using (auth.uid() = user_id);

create trigger calendar_events_set_updated_at
  before update on public.calendar_events
  for each row execute function public.set_updated_at();
