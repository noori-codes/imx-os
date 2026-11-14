-- Task priority for triage (extends Smart Today ranking later)
-- Run after 022_goals_target_habit_schedule.sql

alter table public.tasks
  add column if not exists priority text
    check (priority is null or priority in ('low', 'medium', 'high', 'urgent'));

create index if not exists tasks_user_id_priority_idx
  on public.tasks (user_id, priority)
  where priority is not null;
