-- Phase 10: Daily review
-- Run in Supabase SQL Editor after 006_calendar_events.sql
-- One review per user per day.

create table public.daily_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  review_date date not null,
  went_well text not null default '',
  to_improve text not null default '',
  tomorrow_focus text not null default '',
  mood smallint check (mood is null or (mood between 1 and 5)),
  energy smallint check (energy is null or (energy between 1 and 5)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, review_date)
);

create index daily_reviews_user_id_date_idx
  on public.daily_reviews (user_id, review_date desc);

alter table public.daily_reviews enable row level security;

create policy "Users can view own daily reviews"
  on public.daily_reviews for select
  using (auth.uid() = user_id);

create policy "Users can insert own daily reviews"
  on public.daily_reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update own daily reviews"
  on public.daily_reviews for update
  using (auth.uid() = user_id);

create policy "Users can delete own daily reviews"
  on public.daily_reviews for delete
  using (auth.uid() = user_id);

create trigger daily_reviews_set_updated_at
  before update on public.daily_reviews
  for each row execute function public.set_updated_at();
