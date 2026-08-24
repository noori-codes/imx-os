-- Per-user settings (starts with daily focus goal; safe to extend)

create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  daily_focus_goal_minutes integer not null default 120
    check (
      daily_focus_goal_minutes >= 15
      and daily_focus_goal_minutes <= 720
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "Users can view own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row
  execute function public.set_updated_at();
