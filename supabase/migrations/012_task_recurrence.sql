-- Task recurrence: everyday / weekdays (rolls due_date on complete)

alter table public.tasks
  add column if not exists recurrence text
    check (recurrence is null or recurrence in ('daily', 'weekdays'));

comment on column public.tasks.recurrence is
  'When set, completing the task advances due_date instead of staying completed.';
