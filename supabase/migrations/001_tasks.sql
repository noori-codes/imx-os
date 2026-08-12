-- Run this in Supabase: SQL Editor → New query → Run
-- Phase 3: simple tasks table with row-level security

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  completed boolean not null default false,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_user_id_completed_idx on public.tasks (user_id, completed);

alter table public.tasks enable row level security;

create policy "Users can view own tasks"
  on public.tasks
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on public.tasks
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on public.tasks
  for update
  using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on public.tasks
  for delete
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row
  execute function public.set_updated_at();
