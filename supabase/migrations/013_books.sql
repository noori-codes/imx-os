-- Books reading shelf: want to read / reading / finished / abandoned
-- Run after 012_task_recurrence.sql

create table public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  author text,
  status text not null default 'want_to_read'
    check (status in ('want_to_read', 'reading', 'finished', 'abandoned')),
  current_page integer not null default 0 check (current_page >= 0),
  total_pages integer check (total_pages is null or total_pages > 0),
  rating smallint check (rating is null or (rating between 1 and 5)),
  started_at date,
  finished_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (total_pages is null or current_page <= total_pages)
);

create index books_user_id_status_idx on public.books (user_id, status);
create index books_user_id_updated_at_idx on public.books (user_id, updated_at desc);

alter table public.books enable row level security;

create policy "Users can view own books"
  on public.books for select
  using (auth.uid() = user_id);

create policy "Users can insert own books"
  on public.books for insert
  with check (auth.uid() = user_id);

create policy "Users can update own books"
  on public.books for update
  using (auth.uid() = user_id);

create policy "Users can delete own books"
  on public.books for delete
  using (auth.uid() = user_id);

create trigger books_set_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();

-- Full-text search on title + author
alter table public.books
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(author, '')), 'B')
  ) stored;

create index if not exists books_search_vector_idx
  on public.books using gin (search_vector);

-- Replace unified search RPC to include books
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
      '/books' as href,
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
  limit greatest(result_limit, 1);
$$;

grant execute on function public.search_imx(text, integer) to authenticated;
