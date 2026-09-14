-- Syncable preferences on user_settings (device volume / notify stay local)

alter table public.user_settings
  add column if not exists theme text not null default 'system'
    check (theme in ('light', 'dark', 'system')),
  add column if not exists default_task_view text not null default 'today'
    check (default_task_view in ('today', 'week', 'inbox', 'upcoming', 'all')),
  add column if not exists focus_profile text not null default 'classic'
    check (focus_profile in ('classic', 'deep', 'quick')),
  add column if not exists focus_clock text not null default 'down'
    check (focus_clock in ('up', 'down')),
  add column if not exists auto_start_next boolean not null default false,
  add column if not exists chime_enabled boolean not null default true,
  add column if not exists celebrate_enabled boolean not null default true;
