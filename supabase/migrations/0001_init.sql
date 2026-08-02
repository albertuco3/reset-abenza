-- Reset Abenza — esquema inicial (tablas + RLS)
-- Ejecutar en Supabase → SQL Editor

create extension if not exists "pgcrypto";

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  habit_clean boolean not null default false,
  habit_training boolean not null default false,
  resting_hr smallint check (resting_hr is null or (resting_hr between 30 and 120)),
  sleep_quality smallint check (sleep_quality is null or (sleep_quality between 1 and 10)),
  energy_level smallint check (energy_level is null or (energy_level between 1 and 10)),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create index daily_entries_user_date_idx
  on public.daily_entries (user_id, entry_date desc);

create type public.strength_exercise as enum (
  'squat',
  'deadlift',
  'leg_press'
);

create table public.strength_logs (
  id uuid primary key default gen_random_uuid(),
  daily_entry_id uuid not null references public.daily_entries (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise public.strength_exercise not null,
  weight_kg numeric(6,2) not null check (weight_kg > 0 and weight_kg < 1000),
  created_at timestamptz not null default now(),
  unique (daily_entry_id, exercise)
);

create index strength_logs_user_exercise_idx
  on public.strength_logs (user_id, exercise, created_at);

create type public.emom_exercise as enum (
  'pull_up',
  'push_up'
);

create table public.emom_logs (
  id uuid primary key default gen_random_uuid(),
  daily_entry_id uuid not null references public.daily_entries (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise public.emom_exercise not null,
  duration_minutes smallint not null default 30
    check (duration_minutes between 1 and 120),
  total_reps integer not null check (total_reps >= 0 and total_reps < 5000),
  reps_per_round integer[],
  created_at timestamptz not null default now(),
  unique (daily_entry_id, exercise),
  check (
    reps_per_round is null
    or cardinality(reps_per_round) = duration_minutes
  )
);

create index emom_logs_user_exercise_idx
  on public.emom_logs (user_id, exercise, created_at);

create table public.cardio_logs (
  id uuid primary key default gen_random_uuid(),
  daily_entry_id uuid not null references public.daily_entries (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  activity_type text not null default 'run',
  distance_km numeric(6,2) not null check (distance_km > 0 and distance_km < 500),
  duration_min numeric(7,2) not null check (duration_min > 0 and duration_min < 10000),
  pace_min_per_km numeric(5,2) not null check (pace_min_per_km > 0 and pace_min_per_km < 30),
  created_at timestamptz not null default now(),
  unique (daily_entry_id, activity_type),
  check (
    abs(pace_min_per_km - (duration_min / distance_km))
      <= greatest(0.05, (duration_min / distance_km) * 0.02)
  )
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger daily_entries_updated_at
  before update on public.daily_entries
  for each row execute function public.set_updated_at();

-- Perfil automático al crear usuario Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.daily_entries enable row level security;
alter table public.strength_logs enable row level security;
alter table public.emom_logs enable row level security;
alter table public.cardio_logs enable row level security;

create policy "profiles_own" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "daily_entries_own" on public.daily_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "strength_logs_own" on public.strength_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "emom_logs_own" on public.emom_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "cardio_logs_own" on public.cardio_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
