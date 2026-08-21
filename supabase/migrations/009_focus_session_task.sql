-- Link focus sessions to tasks (optional)
-- Run in Supabase SQL Editor after 008_full_text_search.sql

alter table public.focus_sessions
  add column if not exists task_id uuid references public.tasks (id) on delete set null;

create index if not exists focus_sessions_task_id_idx
  on public.focus_sessions (task_id);
