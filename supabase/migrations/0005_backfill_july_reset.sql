-- Reset Abenza — backfill de días del 25 de julio al 1 de agosto de 2026
-- Ejecutar en Supabase → SQL Editor (después de 0004_meditation_reading_habits.sql)

insert into public.daily_entries (
  user_id,
  entry_date,
  habit_clean,
  habit_training,
  habit_meditation,
  habit_reading
)
select
  coalesce(
    (select user_id from public.daily_entries limit 1),
    (select id from auth.users limit 1)
  ) as user_id,
  d::date as entry_date,
  true as habit_clean,
  true as habit_training,
  false as habit_meditation,
  false as habit_reading
from generate_series('2026-07-25'::date, '2026-08-01'::date, '1 day'::interval) as d
on conflict (user_id, entry_date) do update set
  habit_clean = excluded.habit_clean,
  habit_training = excluded.habit_training,
  habit_meditation = excluded.habit_meditation,
  habit_reading = excluded.habit_reading;
