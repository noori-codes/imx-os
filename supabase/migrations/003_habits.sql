-- Phase 6: Habits + daily check-ins with streaks
-- Run in Supabase SQL Editor after 002_goals_projects.sql

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  color text not null default '#3b82f6',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  logged_on date not null default (current_date),
  created_at timestamptz not null default now(),
  unique (habit_id, logged_on)
);

create index habits_user_id_idx on public.habits (user_id);
create index habits_user_id_archived_idx on public.habits (user_id, archived);
create index habit_logs_habit_id_idx on public.habit_logs (habit_id);
create index habit_logs_user_id_logged_on_idx on public.habit_logs (user_id, logged_on);

alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;

-- Habits policies
create policy "Users can view own habits"
  on public.habits for select
  using (auth.uid() = user_id);

create policy "Users can insert own habits"
  on public.habits for insert
  with check (auth.uid() = user_id);

create policy "Users can update own habits"
  on public.habits for update
  using (auth.uid() = user_id);

create policy "Users can delete own habits"
  on public.habits for delete
  using (auth.uid() = user_id);

-- Habit logs policies
create policy "Users can view own habit logs"
  on public.habit_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own habit logs"
  on public.habit_logs for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.habits
      where habits.id = habit_id and habits.user_id = auth.uid()
    )
  );

create policy "Users can delete own habit logs"
  on public.habit_logs for delete
  using (auth.uid() = user_id);

create trigger habits_set_updated_at
  before update on public.habits
  for each row execute function public.set_updated_at();
