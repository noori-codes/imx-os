-- Optional end time for calendar events (duration / range display).

alter table public.calendar_events
  add column if not exists end_time time;

comment on column public.calendar_events.end_time is
  'Optional end time; when set with start_time, UI shows a range.';
