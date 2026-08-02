-- Reset Abenza — tipos de sesión + reps/modalidad en fuerza
-- Ejecutar en Supabase → SQL Editor (después de 0001_init.sql)

create type public.session_type as enum (
  'cardio',
  'leg_strength',
  'leg_hypertrophy',
  'torso_hypertrophy',
  'torso_strength',
  'rest'
);

create type public.training_modality as enum (
  'strength',
  'hypertrophy'
);

alter table public.daily_entries
  add column if not exists session_type public.session_type,
  add column if not exists torso_hypertrophy_mode text
    check (
      torso_hypertrophy_mode is null
      or torso_hypertrophy_mode in ('classic', 'emom')
    );

-- Ampliar ejercicios de fuerza (dominadas / flexiones)
alter type public.strength_exercise add value if not exists 'pull_up';
alter type public.strength_exercise add value if not exists 'push_up';

alter table public.strength_logs
  add column if not exists modality public.training_modality,
  add column if not exists reps integer
    check (reps is null or (reps >= 0 and reps < 1000));

-- kg opcional (p. ej. flexiones/dominadas clásicas solo con reps)
alter table public.strength_logs
  alter column weight_kg drop not null;

alter table public.strength_logs
  drop constraint if exists strength_logs_weight_kg_check;

alter table public.strength_logs
  add constraint strength_logs_weight_kg_check
  check (weight_kg is null or (weight_kg >= 0 and weight_kg < 1000));

-- Backfill modalidad en filas antiguas
update public.strength_logs
set modality = 'strength'
where modality is null;

alter table public.strength_logs
  alter column modality set default 'strength';

alter table public.strength_logs
  alter column modality set not null;
