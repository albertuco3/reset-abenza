-- Reset Abenza — 4 series por ejercicio de fuerza/hipertrofia clásico
-- Ejecutar en Supabase → SQL Editor (después de 0005_backfill_july_reset.sql)
--
-- reps_per_set: desglose de las 4 series.
-- reps: suma de esas series en logs nuevos. Los logs antiguos (1ª serie) se dejan igual.

alter table public.strength_logs
  add column if not exists reps_per_set integer[];

alter table public.strength_logs
  drop constraint if exists strength_logs_reps_per_set_check;

alter table public.strength_logs
  add constraint strength_logs_reps_per_set_check
  check (
    reps_per_set is null
    or (
      cardinality(reps_per_set) = 4
      and reps_per_set[1] is not null and reps_per_set[1] >= 0 and reps_per_set[1] < 1000
      and reps_per_set[2] is not null and reps_per_set[2] >= 0 and reps_per_set[2] < 1000
      and reps_per_set[3] is not null and reps_per_set[3] >= 0 and reps_per_set[3] < 1000
      and reps_per_set[4] is not null and reps_per_set[4] >= 0 and reps_per_set[4] < 1000
    )
  );

-- La suma de 4 series puede superar el tope anterior (1000)
alter table public.strength_logs
  drop constraint if exists strength_logs_reps_check;

alter table public.strength_logs
  add constraint strength_logs_reps_check
  check (reps is null or (reps >= 0 and reps < 4000));
