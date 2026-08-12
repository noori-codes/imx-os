-- Phase 4: Goals → Projects → Tasks hierarchy
-- Run in Supabase SQL Editor after 001_tasks.sql

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks
  add column project_id uuid references public.projects (id) on delete cascade;

create index goals_user_id_idx on public.goals (user_id);
create index projects_user_id_idx on public.projects (user_id);
create index projects_goal_id_idx on public.projects (goal_id);
create index tasks_project_id_idx on public.tasks (project_id);

alter table public.goals enable row level security;
alter table public.projects enable row level security;

-- Goals policies
create policy "Users can view own goals"
  on public.goals for select
  using (auth.uid() = user_id);

create policy "Users can insert own goals"
  on public.goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own goals"
  on public.goals for update
  using (auth.uid() = user_id);

create policy "Users can delete own goals"
  on public.goals for delete
  using (auth.uid() = user_id);

-- Projects policies
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on public.projects for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.goals
      where goals.id = goal_id and goals.user_id = auth.uid()
    )
  );

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Updated_at triggers
create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- Tasks: allow insert only if project belongs to user (when project_id set)
create policy "Users can insert tasks for own projects"
  on public.tasks for insert
  with check (
    auth.uid() = user_id
    and (
      project_id is null
      or exists (
        select 1 from public.projects
        where projects.id = project_id and projects.user_id = auth.uid()
      )
    )
  );

-- Drop old insert policy (replaced by stricter one above)
drop policy if exists "Users can insert own tasks" on public.tasks;
