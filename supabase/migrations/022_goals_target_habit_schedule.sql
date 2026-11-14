-- Goal target dates + status; habit weekday schedules
-- Run in Supabase SQL Editor after 021_avatars_storage.sql

-- Goals: optional target date + lifecycle status (archive without delete)
alter table public.goals
  add column if not exists target_date date,
  add column if not exists status text not null default 'active'
    check (status in ('active', 'paused', 'completed', 'archived'));

create index if not exists goals_user_id_status_idx
  on public.goals (user_id, status);

-- Habits: which weekdays apply (0=Sun … 6=Sat). NULL / empty = every day.
alter table public.habits
  add column if not exists schedule_days smallint[];

comment on column public.habits.schedule_days is
  'Weekdays this habit is due (0=Sun..6=Sat). NULL means every day.';

-- Soft streak freeze counter on user_settings (engagement / fair failure)
alter table public.user_settings
  add column if not exists streak_freezes_remaining smallint not null default 1
    check (streak_freezes_remaining >= 0 and streak_freezes_remaining <= 3),
  add column if not exists timezone text;
