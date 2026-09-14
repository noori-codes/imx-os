-- Cooldown for Weekly AI insight (server-enforced)

alter table public.user_settings
  add column if not exists last_ai_insight_at timestamptz;
