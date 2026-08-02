-- Seed de demostración (borra/ajusta antes de datos reales).
-- Requiere haber ejecutado 0001_init.sql y 0002_session_training.sql
-- 1) Sustituye YOUR_USER_UUID por tu auth.users.id
-- 2) Ejecuta en SQL Editor de Supabase

-- select id, email from auth.users;

do $$
declare
  uid uuid := 'YOUR_USER_UUID';
  d date;
  entry_id uuid;
  sess public.session_type;
begin
  for i in 0..20 loop
    d := (current_date - (20 - i));

    sess := case extract(isodow from d)::int
      when 1 then 'cardio'::public.session_type
      when 2 then 'leg_strength'::public.session_type
      when 3 then 'torso_hypertrophy'::public.session_type
      when 4 then 'cardio'::public.session_type
      when 5 then 'leg_hypertrophy'::public.session_type
      when 6 then 'torso_strength'::public.session_type
      else 'rest'::public.session_type
    end;

    insert into public.daily_entries (
      user_id, entry_date, habit_clean, habit_training,
      session_type, torso_hypertrophy_mode,
      sleep_quality, energy_level, notes
    ) values (
      uid, d,
      (i % 5 <> 0),
      (sess <> 'rest'),
      sess,
      case when sess = 'torso_hypertrophy' then
        case when i % 2 = 0 then 'emom' else 'classic' end
      else null end,
      5 + (i % 5),
      5 + ((i + 2) % 5),
      'seed'
    )
    on conflict (user_id, entry_date) do update set
      habit_clean = excluded.habit_clean,
      habit_training = excluded.habit_training,
      session_type = excluded.session_type,
      torso_hypertrophy_mode = excluded.torso_hypertrophy_mode,
      sleep_quality = excluded.sleep_quality,
      energy_level = excluded.energy_level
    returning id into entry_id;

    delete from public.strength_logs where daily_entry_id = entry_id;
    delete from public.emom_logs where daily_entry_id = entry_id;
    delete from public.cardio_logs where daily_entry_id = entry_id;

    if sess = 'leg_strength' then
      insert into public.strength_logs (daily_entry_id, user_id, exercise, modality, weight_kg, reps)
      values (entry_id, uid, 'squat', 'strength', 100 + i, 3 + (i % 3));
    elsif sess = 'leg_hypertrophy' then
      insert into public.strength_logs (daily_entry_id, user_id, exercise, modality, weight_kg, reps)
      values (entry_id, uid, 'squat', 'hypertrophy', 70 + i, 8 + (i % 4));
    elsif sess = 'torso_strength' then
      insert into public.strength_logs (daily_entry_id, user_id, exercise, modality, weight_kg, reps)
      values (entry_id, uid, 'pull_up', 'strength', 10 + (i % 5), 4 + (i % 3));
    elsif sess = 'torso_hypertrophy' and i % 2 = 1 then
      insert into public.strength_logs (daily_entry_id, user_id, exercise, modality, weight_kg, reps)
      values
        (entry_id, uid, 'pull_up', 'hypertrophy', null, 8 + (i % 4)),
        (entry_id, uid, 'push_up', 'hypertrophy', null, 15 + (i % 5));
    elsif sess = 'torso_hypertrophy' then
      insert into public.emom_logs (daily_entry_id, user_id, exercise, duration_minutes, total_reps)
      values
        (entry_id, uid, 'pull_up', 30, 90 + i * 2),
        (entry_id, uid, 'push_up', 30, 180 + i * 3);
    elsif sess = 'cardio' then
      insert into public.cardio_logs (
        daily_entry_id, user_id, activity_type,
        distance_km, duration_min, pace_min_per_km
      ) values (
        entry_id, uid, 'run',
        5 + (i % 5),
        (5 + (i % 5)) * 5.4,
        5.40
      );
    end if;
  end loop;
end $$;
