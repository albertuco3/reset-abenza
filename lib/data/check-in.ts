import { formatDuration } from "@/lib/cardio";
import { defaultSessionForDate } from "@/lib/sessions";
import { createClient } from "@/lib/supabase/server";
import type { CheckInFormValues } from "@/lib/validations/check-in";

export type CheckInLoad = {
  values: CheckInFormValues;
  exists: boolean;
};

function emptyValues(entryDate: string): CheckInFormValues {
  return {
    entry_date: entryDate,
    habit_clean: false,
    habit_training: false,
    habit_meditation: false,
    habit_reading: false,
    session_type: defaultSessionForDate(entryDate),
    torso_hypertrophy_mode: "emom",
    sleep_quality: undefined,
    energy_level: undefined,
    squat_kg: undefined,
    squat_reps: undefined,
    pull_up_kg: undefined,
    pull_up_reps: undefined,
    push_up_reps: undefined,
    emom_pull_up_reps: undefined,
    emom_push_up_reps: undefined,
    emom_duration_minutes: 30,
    cardio_distance_km: undefined,
    cardio_duration: "",
    notes: "",
  };
}

export async function getCheckInLoad(entryDate: string): Promise<CheckInLoad> {
  const empty = emptyValues(entryDate);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { values: empty, exists: false };

  const { data: entry } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", user.id)
    .eq("entry_date", entryDate)
    .maybeSingle();

  if (!entry) return { values: empty, exists: false };

  const [{ data: strength }, { data: emom }, { data: cardio }] =
    await Promise.all([
      supabase.from("strength_logs").select("*").eq("daily_entry_id", entry.id),
      supabase.from("emom_logs").select("*").eq("daily_entry_id", entry.id),
      supabase
        .from("cardio_logs")
        .select("*")
        .eq("daily_entry_id", entry.id)
        .eq("activity_type", "run")
        .maybeSingle(),
    ]);

  const squat = (strength ?? []).find((s) => s.exercise === "squat");
  const pullUp = (strength ?? []).find((s) => s.exercise === "pull_up");
  const pushUp = (strength ?? []).find((s) => s.exercise === "push_up");
  const emomBy = Object.fromEntries((emom ?? []).map((e) => [e.exercise, e]));

  const sessionType = entry.session_type ?? defaultSessionForDate(entryDate);

  return {
    exists: true,
    values: {
      entry_date: entry.entry_date,
      habit_clean: entry.habit_clean,
      habit_training: entry.habit_training,
      habit_meditation: entry.habit_meditation ?? false,
      habit_reading: entry.habit_reading ?? false,
      session_type: sessionType,
      torso_hypertrophy_mode:
        entry.torso_hypertrophy_mode ??
        (emomBy.pull_up || emomBy.push_up ? "emom" : "classic"),
      sleep_quality: entry.sleep_quality ?? undefined,
      energy_level: entry.energy_level ?? undefined,
      squat_kg: squat?.weight_kg != null ? Number(squat.weight_kg) : undefined,
      squat_reps: squat?.reps != null ? Number(squat.reps) : undefined,
      pull_up_kg:
        pullUp?.weight_kg != null ? Number(pullUp.weight_kg) : undefined,
      pull_up_reps: pullUp?.reps != null ? Number(pullUp.reps) : undefined,
      push_up_reps: pushUp?.reps != null ? Number(pushUp.reps) : undefined,
      emom_pull_up_reps: emomBy.pull_up?.total_reps,
      emom_push_up_reps: emomBy.push_up?.total_reps,
      emom_duration_minutes:
        emomBy.pull_up?.duration_minutes ??
        emomBy.push_up?.duration_minutes ??
        30,
      cardio_distance_km: cardio ? Number(cardio.distance_km) : undefined,
      cardio_duration: cardio
        ? formatDuration(Number(cardio.duration_min))
        : "",
      notes: entry.notes ?? "",
    },
  };
}

/** @deprecated use getCheckInLoad */
export async function getCheckInDefaults(
  entryDate: string,
): Promise<CheckInFormValues> {
  const { values } = await getCheckInLoad(entryDate);
  return values;
}
