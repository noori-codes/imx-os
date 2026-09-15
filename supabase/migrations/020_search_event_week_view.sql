-- Search event deep links open week view (calendar polish).
create or replace function public.search_imx(
  search_query text,
  result_limit int default 40
)
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
        when t.completed then '/tasks'
        else '/focus?task=' || t.id::text
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
      '/habits#habit-' || h.id::text as href,
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
      '/calendar?view=week&date=' || e.event_date::text || '#event-' || e.id::text as href,
      ts_rank(e.search_vector, q.query) as rank
    from public.calendar_events e
    cross join q
    where e.search_vector @@ q.query
      and e.user_id = auth.uid()
  ),
  book_hits as (
    select
      b.id,
      'book'::text,
      b.title,
      case
        when b.status = 'reading' then 'Reading' || coalesce(' · ' || nullif(b.author, ''), '')
        when b.status = 'finished' then 'Finished' || coalesce(' · ' || nullif(b.author, ''), '')
        when b.status = 'abandoned' then 'Abandoned' || coalesce(' · ' || nullif(b.author, ''), '')
        else 'Want to read' || coalesce(' · ' || nullif(b.author, ''), '')
      end as subtitle,
      '/books#book-' || b.id::text as href,
      ts_rank(b.search_vector, q.query) as rank
    from public.books b
    cross join q
    where b.search_vector @@ q.query
      and b.user_id = auth.uid()
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
    union all
    select * from book_hits
  ) hits
  order by rank desc, title asc
  limit greatest(1, least(result_limit, 100));
$$;
