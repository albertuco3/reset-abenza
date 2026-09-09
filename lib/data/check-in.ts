import { formatDuration } from "@/lib/cardio";
import {
  EMPTY_RECOMMENDATIONS,
  parseFourSets,
  recommendNextSession,
  type StrengthRecommendations,
} from "@/lib/progression";
import { defaultSessionForDate } from "@/lib/sessions";
import { createClient } from "@/lib/supabase/server";
import type { StrengthExercise } from "@/lib/types";
import type { TrainingModality } from "@/lib/sessions";
import type { CheckInFormValues } from "@/lib/validations/check-in";

export type CheckInLoad = {
  values: CheckInFormValues;
  exists: boolean;
  recommendations: StrengthRecommendations;
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
    squat_set_1: undefined,
    squat_set_2: undefined,
    squat_set_3: undefined,
    squat_set_4: undefined,
    pull_up_kg: undefined,
    pull_up_set_1: undefined,
    pull_up_set_2: undefined,
    pull_up_set_3: undefined,
    pull_up_set_4: undefined,
    push_up_kg: undefined,
    push_up_set_1: undefined,
    push_up_set_2: undefined,
    push_up_set_3: undefined,
    push_up_set_4: undefined,
    emom_pull_up_reps: undefined,
    emom_push_up_reps: undefined,
    emom_duration_minutes: 30,
    cardio_distance_km: undefined,
    cardio_duration: "",
    notes: "",
  };
}

type StrengthLogRow = {
  exercise: StrengthExercise;
  modality: TrainingModality;
  weight_kg: number | null;
  reps: number | null;
  reps_per_set: unknown;
};

function setsFromLog(log: StrengthLogRow | undefined): {
  set_1: number | undefined;
  set_2: number | undefined;
  set_3: number | undefined;
  set_4: number | undefined;
} {
  const parsed = parseFourSets(log?.reps_per_set);
  if (parsed) {
    return {
      set_1: parsed[0],
      set_2: parsed[1],
      set_3: parsed[2],
      set_4: parsed[3],
    };
  }
  if (log?.reps != null) {
    return {
      set_1: Number(log.reps),
      set_2: undefined,
      set_3: undefined,
      set_4: undefined,
    };
  }
  return {
    set_1: undefined,
    set_2: undefined,
    set_3: undefined,
    set_4: undefined,
  };
}

function recommendationKey(
  exercise: string,
  modality: string,
): keyof StrengthRecommendations | null {
  if (exercise === "squat" && modality === "strength") return "squat_strength";
  if (exercise === "squat" && modality === "hypertrophy") {
    return "squat_hypertrophy";
  }
  if (exercise === "pull_up" && modality === "strength") {
    return "pull_up_strength";
  }
  if (exercise === "pull_up" && modality === "hypertrophy") {
    return "pull_up_hypertrophy";
  }
  if (exercise === "push_up" && modality === "hypertrophy") {
    return "push_up_hypertrophy";
  }
  return null;
}

async function loadRecommendations(
  userId: string,
  entryDate: string,
): Promise<StrengthRecommendations> {
  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("daily_entries")
    .select(
      "entry_date, strength_logs(exercise, modality, weight_kg, reps_per_set)",
    )
    .eq("user_id", userId)
    .lt("entry_date", entryDate)
    .order("entry_date", { ascending: false });

  const recommendations: StrengthRecommendations = { ...EMPTY_RECOMMENDATIONS };
  if (!previous) return recommendations;

  for (const entry of previous) {
    const logs = (entry.strength_logs ?? []) as {
      exercise: string;
      modality: string;
      weight_kg: number | null;
      reps_per_set: unknown;
    }[];
    for (const log of logs) {
      const key = recommendationKey(log.exercise, log.modality);
      if (!key || recommendations[key]) continue;
      const sets = parseFourSets(log.reps_per_set);
      if (!sets) continue;
      recommendations[key] = recommendNextSession(
        {
          repsPerSet: sets,
          weightKg: log.weight_kg != null ? Number(log.weight_kg) : null,
        },
        log.modality === "strength" ? "strength" : "hypertrophy",
      );
    }
  }

  return recommendations;
}

export async function getCheckInLoad(entryDate: string): Promise<CheckInLoad> {
  const empty = emptyValues(entryDate);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      values: empty,
      exists: false,
      recommendations: EMPTY_RECOMMENDATIONS,
    };
  }

  const recommendations = await loadRecommendations(user.id, entryDate);

  const { data: entry } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", user.id)
    .eq("entry_date", entryDate)
    .maybeSingle();

  if (!entry) {
    return { values: empty, exists: false, recommendations };
  }

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

  const squat = (strength ?? []).find((s) => s.exercise === "squat") as
    | StrengthLogRow
    | undefined;
  const pullUp = (strength ?? []).find((s) => s.exercise === "pull_up") as
    | StrengthLogRow
    | undefined;
  const pushUp = (strength ?? []).find((s) => s.exercise === "push_up") as
    | StrengthLogRow
    | undefined;
  const emomBy = Object.fromEntries((emom ?? []).map((e) => [e.exercise, e]));

  const sessionType = entry.session_type ?? defaultSessionForDate(entryDate);
  const squatSets = setsFromLog(squat);
  const pullUpSets = setsFromLog(pullUp);
  const pushUpSets = setsFromLog(pushUp);

  return {
    exists: true,
    recommendations,
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
      squat_set_1: squatSets.set_1,
      squat_set_2: squatSets.set_2,
      squat_set_3: squatSets.set_3,
      squat_set_4: squatSets.set_4,
      pull_up_kg:
        pullUp?.weight_kg != null ? Number(pullUp.weight_kg) : undefined,
      pull_up_set_1: pullUpSets.set_1,
      pull_up_set_2: pullUpSets.set_2,
      pull_up_set_3: pullUpSets.set_3,
      pull_up_set_4: pullUpSets.set_4,
      push_up_kg:
        pushUp?.weight_kg != null ? Number(pushUp.weight_kg) : undefined,
      push_up_set_1: pushUpSets.set_1,
      push_up_set_2: pushUpSets.set_2,
      push_up_set_3: pushUpSets.set_3,
      push_up_set_4: pushUpSets.set_4,
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
