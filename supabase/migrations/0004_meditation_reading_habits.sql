-- Reset Abenza — nuevos hábitos: meditación y lectura
-- Ejecutar en Supabase → SQL Editor (después de 0003_public_read.sql)

alter table public.daily_entries
  add column if not exists habit_meditation boolean not null default false,
  add column if not exists habit_reading boolean not null default false;
