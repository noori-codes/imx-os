-- Allow users to update own focus sessions (e.g. continue + seal adds time in place)

create policy "Users can update own focus sessions"
  on public.focus_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
