-- Phase 12: Full-text search across tasks, notes, goals, projects, habits, events
-- Run in Supabase SQL Editor after 007_daily_reviews.sql

-- Tasks
alter table public.tasks
  add column if not exists search_vector tsvector
  generated always as (
    to_tsvector('english', coalesce(title, ''))
  ) stored;

create index if not exists tasks_search_vector_idx
  on public.tasks using gin (search_vector);

-- Goals
alter table public.goals
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored;

create index if not exists goals_search_vector_idx
  on public.goals using gin (search_vector);

-- Projects
alter table public.projects
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored;

create index if not exists projects_search_vector_idx
  on public.projects using gin (search_vector);

-- Notes (strip HTML tags from content for cleaner indexing)
alter table public.notes
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(
      to_tsvector(
        'english',
        regexp_replace(coalesce(content, ''), '<[^>]+>', ' ', 'g')
      ),
      'B'
    )
  ) stored;

create index if not exists notes_search_vector_idx
  on public.notes using gin (search_vector);

-- Habits
alter table public.habits
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored;

create index if not exists habits_search_vector_idx
  on public.habits using gin (search_vector);

-- Calendar events
alter table public.calendar_events
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored;

create index if not exists calendar_events_search_vector_idx
  on public.calendar_events using gin (search_vector);

-- Unified search RPC (RLS still applies via security invoker)
create or replace function public.search_imx(search_query text, result_limit integer default 40)
returns table (
  id uuid,
  entity_type text,
  title text,
  subtitle text,
  href text,
  rank real
)
language sql
stable
security invoker
set search_path = public
as $$
  with q as (
    select websearch_to_tsquery('english', search_query) as query
  ),
  task_hits as (
    select
      t.id,
      'task'::text as entity_type,
      t.title,
      case
        when t.completed then 'Completed task'
        when t.due_date is not null then 'Task · due ' || t.due_date::text
        else 'Task'
      end as subtitle,
      case
        when t.project_id is not null then
          '/goals/' || p.goal_id::text || '/projects/' || t.project_id::text
        else '/tasks'
      end as href,
      ts_rank(t.search_vector, q.query) as rank
    from public.tasks t
    left join public.projects p on p.id = t.project_id
    cross join q
    where t.search_vector @@ q.query
      and t.user_id = auth.uid()
  ),
  goal_hits as (
    select
      g.id,
      'goal'::text,
      g.title,
      coalesce(nullif(g.description, ''), 'Goal') as subtitle,
      '/goals/' || g.id::text as href,
      ts_rank(g.search_vector, q.query) as rank
    from public.goals g
    cross join q
    where g.search_vector @@ q.query
      and g.user_id = auth.uid()
  ),
  project_hits as (
    select
      p.id,
      'project'::text,
      p.title,
      'Project in ' || g.title as subtitle,
      '/goals/' || p.goal_id::text || '/projects/' || p.id::text as href,
      ts_rank(p.search_vector, q.query) as rank
    from public.projects p
    join public.goals g on g.id = p.goal_id
    cross join q
    where p.search_vector @@ q.query
      and p.user_id = auth.uid()
  ),
  note_hits as (
    select
      n.id,
      'note'::text,
      n.title,
      case
        when n.type = 'journal' then 'Journal · ' || coalesce(n.journal_date::text, '')
        else 'Note'
      end as subtitle,
      '/notes/' || n.id::text as href,
      ts_rank(n.search_vector, q.query) as rank
    from public.notes n
    cross join q
    where n.search_vector @@ q.query
      and n.user_id = auth.uid()
  ),
  habit_hits as (
    select
      h.id,
      'habit'::text,
      h.title,
      coalesce(nullif(h.description, ''), 'Habit') as subtitle,
      '/habits' as href,
      ts_rank(h.search_vector, q.query) as rank
    from public.habits h
    cross join q
    where h.search_vector @@ q.query
      and h.user_id = auth.uid()
      and h.archived = false
  ),
  event_hits as (
    select
      e.id,
      'event'::text,
      e.title,
      'Event · ' || e.event_date::text as subtitle,
      '/calendar?date=' || e.event_date::text as href,
      ts_rank(e.search_vector, q.query) as rank
    from public.calendar_events e
    cross join q
    where e.search_vector @@ q.query
      and e.user_id = auth.uid()
  )
  select * from (
    select * from task_hits
    union all
    select * from goal_hits
    union all
    select * from project_hits
    union all
    select * from note_hits
    union all
    select * from habit_hits
    union all
    select * from event_hits
  ) hits
  order by rank desc, title asc
  limit greatest(result_limit, 1);
$$;

grant execute on function public.search_imx(text, integer) to authenticated;
