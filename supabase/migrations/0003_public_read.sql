-- Lectura pública del dashboard; escritura solo del dueño autenticado.
-- Ejecutar en Supabase → SQL Editor

-- daily_entries
drop policy if exists "daily_entries_own" on public.daily_entries;
create policy "daily_entries_public_read"
  on public.daily_entries for select
  using (true);
create policy "daily_entries_owner_insert"
  on public.daily_entries for insert
  with check (auth.uid() = user_id);
create policy "daily_entries_owner_update"
  on public.daily_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "daily_entries_owner_delete"
  on public.daily_entries for delete
  using (auth.uid() = user_id);

-- strength_logs
drop policy if exists "strength_logs_own" on public.strength_logs;
create policy "strength_logs_public_read"
  on public.strength_logs for select
  using (true);
create policy "strength_logs_owner_insert"
  on public.strength_logs for insert
  with check (auth.uid() = user_id);
create policy "strength_logs_owner_update"
  on public.strength_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "strength_logs_owner_delete"
  on public.strength_logs for delete
  using (auth.uid() = user_id);

-- emom_logs
drop policy if exists "emom_logs_own" on public.emom_logs;
create policy "emom_logs_public_read"
  on public.emom_logs for select
  using (true);
create policy "emom_logs_owner_insert"
  on public.emom_logs for insert
  with check (auth.uid() = user_id);
create policy "emom_logs_owner_update"
  on public.emom_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "emom_logs_owner_delete"
  on public.emom_logs for delete
  using (auth.uid() = user_id);

-- cardio_logs
drop policy if exists "cardio_logs_own" on public.cardio_logs;
create policy "cardio_logs_public_read"
  on public.cardio_logs for select
  using (true);
create policy "cardio_logs_owner_insert"
  on public.cardio_logs for insert
  with check (auth.uid() = user_id);
create policy "cardio_logs_owner_update"
  on public.cardio_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "cardio_logs_owner_delete"
  on public.cardio_logs for delete
  using (auth.uid() = user_id);

-- profiles: siguen privados (no exponer email)
-- policy profiles_own sin cambios
