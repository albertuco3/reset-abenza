"use server";

import { revalidatePath } from "next/cache";
import { completeCardioTrio, parseDurationInput } from "@/lib/cardio";
import { createClient } from "@/lib/supabase/server";
import type { EmomExercise, StrengthExercise } from "@/lib/types";
import type { TrainingModality } from "@/lib/sessions";
import { sumSets, type FourSets, type StrengthRecommendations } from "@/lib/progression";
import {
  checkInSchema,
  completeSetsOrNull,
  getSetValues,
  type CheckInFormValues,
  type CheckInParsed,
  type SetPrefix,
} from "@/lib/validations/check-in";
import { getCheckInLoad } from "@/lib/data/check-in";

export type CheckInState = {
  ok: boolean;
  message: string;
};

type StrengthRow = {
  daily_entry_id: string;
  user_id: string;
  exercise: StrengthExercise;
  modality: TrainingModality;
  weight_kg: number | null;
  reps: number | null;
  reps_per_set: FourSets;
};

function strengthFromSets(
  data: CheckInParsed,
  prefix: SetPrefix,
  incompleteMessage: string,
):
  | { ok: true; sets: FourSets | null }
  | { ok: false; message: string } {
  const sets = completeSetsOrNull(data, prefix);
  if (sets) return { ok: true, sets };
  if (!getSetValues(data, prefix).some((value) => value != null)) {
    return { ok: true, sets: null };
  }
  return { ok: false, message: incompleteMessage };
}

export async function saveCheckIn(raw: unknown): Promise<CheckInState> {
  const parsed = checkInSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Revisa los datos del formulario." };
  }

  const data: CheckInParsed = parsed.data;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Sesión expirada. Vuelve a entrar." };
  }

  const habitTraining =
    data.session_type === "rest" ? data.habit_training : true;

  const { data: entry, error: entryError } = await supabase
    .from("daily_entries")
    .upsert(
      {
        user_id: user.id,
        entry_date: data.entry_date,
        habit_clean: data.habit_clean,
        habit_training: habitTraining,
        habit_meditation: data.habit_meditation,
        habit_reading: data.habit_reading,
        session_type: data.session_type,
        torso_hypertrophy_mode:
          data.session_type === "torso_hypertrophy"
            ? (data.torso_hypertrophy_mode ?? null)
            : null,
        resting_hr: null,
        sleep_quality: data.sleep_quality ?? null,
        energy_level: data.energy_level ?? null,
        notes: data.notes?.trim() || null,
      },
      { onConflict: "user_id,entry_date" },
    )
    .select("id")
    .single();

  if (entryError || !entry) {
    return {
      ok: false,
      message: entryError?.message ?? "No se pudo guardar la entrada diaria.",
    };
  }

  // Limpiar logs previos del día y reescribir según sesión
  await Promise.all([
    supabase.from("strength_logs").delete().eq("daily_entry_id", entry.id),
    supabase.from("emom_logs").delete().eq("daily_entry_id", entry.id),
    supabase.from("cardio_logs").delete().eq("daily_entry_id", entry.id),
  ]);

  const strengthRows: StrengthRow[] = [];

  if (
    data.session_type === "leg_strength" ||
    data.session_type === "leg_hypertrophy"
  ) {
    const modality: TrainingModality =
      data.session_type === "leg_strength" ? "strength" : "hypertrophy";
    const squatSets = strengthFromSets(
      data,
      "squat_set",
      "Sentadilla búlgara: indica las 4 series.",
    );
    if (!squatSets.ok) return squatSets;
    if (data.squat_kg != null || squatSets.sets) {
      if (data.squat_kg == null) {
        return { ok: false, message: "Sentadilla búlgara: indica los kilos." };
      }
      if (!squatSets.sets) {
        return { ok: false, message: "Sentadilla búlgara: indica las 4 series." };
      }
      strengthRows.push({
        daily_entry_id: entry.id,
        user_id: user.id,
        exercise: "squat",
        modality,
        weight_kg: data.squat_kg,
        reps: sumSets(squatSets.sets),
        reps_per_set: squatSets.sets,
      });
    }
  }

  if (data.session_type === "torso_strength") {
    const pullSets = strengthFromSets(
      data,
      "pull_up_set",
      "Dominadas lastradas: indica las 4 series.",
    );
    if (!pullSets.ok) return pullSets;
    if (data.pull_up_kg != null || pullSets.sets) {
      if (data.pull_up_kg == null) {
        return {
          ok: false,
          message: "Dominadas lastradas: indica los kg de lastre.",
        };
      }
      if (!pullSets.sets) {
        return {
          ok: false,
          message: "Dominadas lastradas: indica las 4 series.",
        };
      }
      strengthRows.push({
        daily_entry_id: entry.id,
        user_id: user.id,
        exercise: "pull_up",
        modality: "strength",
        weight_kg: data.pull_up_kg,
        reps: sumSets(pullSets.sets),
        reps_per_set: pullSets.sets,
      });
    }
  }

  if (
    data.session_type === "torso_hypertrophy" &&
    data.torso_hypertrophy_mode === "classic"
  ) {
    const pullSets = strengthFromSets(
      data,
      "pull_up_set",
      "Dominadas: indica las 4 series.",
    );
    if (!pullSets.ok) return pullSets;
    if (pullSets.sets) {
      strengthRows.push({
        daily_entry_id: entry.id,
        user_id: user.id,
        exercise: "pull_up",
        modality: "hypertrophy",
        weight_kg: null,
        reps: sumSets(pullSets.sets),
        reps_per_set: pullSets.sets,
      });
    }
    const pushSets = strengthFromSets(
      data,
      "push_up_set",
      "Flexiones en anillas: indica las 4 series.",
    );
    if (!pushSets.ok) return pushSets;
    if (pushSets.sets) {
      strengthRows.push({
        daily_entry_id: entry.id,
        user_id: user.id,
        exercise: "push_up",
        modality: "hypertrophy",
        weight_kg: null,
        reps: sumSets(pushSets.sets),
        reps_per_set: pushSets.sets,
      });
    }
  }

  if (strengthRows.length) {
    const { error } = await supabase.from("strength_logs").insert(strengthRows);
    if (error) {
      return { ok: false, message: `Fuerza: ${error.message}` };
    }
  }

  if (
    data.session_type === "torso_hypertrophy" &&
    data.torso_hypertrophy_mode === "emom"
  ) {
    const emomDuration = data.emom_duration_minutes ?? 30;
    const emomRows: {
      daily_entry_id: string;
      user_id: string;
      exercise: EmomExercise;
      duration_minutes: number;
      total_reps: number;
    }[] = [];

    if (data.emom_pull_up_reps != null) {
      emomRows.push({
        daily_entry_id: entry.id,
        user_id: user.id,
        exercise: "pull_up",
        duration_minutes: emomDuration,
        total_reps: data.emom_pull_up_reps,
      });
    }
    if (data.emom_push_up_reps != null) {
      emomRows.push({
        daily_entry_id: entry.id,
        user_id: user.id,
        exercise: "push_up",
        duration_minutes: emomDuration,
        total_reps: data.emom_push_up_reps,
      });
    }

    if (emomRows.length) {
      const { error } = await supabase.from("emom_logs").insert(emomRows);
      if (error) {
        return { ok: false, message: `EMOM: ${error.message}` };
      }
    }
  }

  if (data.session_type === "cardio") {
    const durationMin = data.cardio_duration
      ? parseDurationInput(data.cardio_duration)
      : null;

    const cardio = completeCardioTrio({
      distance_km: data.cardio_distance_km,
      duration_min: durationMin ?? undefined,
    });

    if (data.cardio_distance_km != null || data.cardio_duration) {
      if (!cardio) {
        return {
          ok: false,
          message: "Cardio: indica distancia y tiempo (o deja ambos vacíos).",
        };
      }
      const { error } = await supabase.from("cardio_logs").insert({
        daily_entry_id: entry.id,
        user_id: user.id,
        activity_type: "run",
        distance_km: cardio.distance_km,
        duration_min: cardio.duration_min,
        pace_min_per_km: cardio.pace_min_per_km,
      });
      if (error) {
        return { ok: false, message: `Cardio: ${error.message}` };
      }
    }
  }

  revalidatePath("/");
  revalidatePath("/check-in");
  return { ok: true, message: "Guardado." };
}

export async function loadCheckInForDate(
  entryDate: string,
): Promise<
  | {
      ok: true;
      values: CheckInFormValues;
      exists: boolean;
      recommendations: StrengthRecommendations;
    }
  | { ok: false; message: string }
> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
    return { ok: false, message: "Fecha inválida." };
  }

  const loaded = await getCheckInLoad(entryDate);
  return {
    ok: true,
    values: loaded.values,
    exists: loaded.exists,
    recommendations: loaded.recommendations,
  };
}

export async function deleteCheckInDay(
  entryDate: string,
): Promise<CheckInState> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
    return { ok: false, message: "Fecha inválida." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Sesión expirada. Vuelve a entrar." };
  }

  const { error } = await supabase
    .from("daily_entries")
    .delete()
    .eq("user_id", user.id)
    .eq("entry_date", entryDate);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/check-in");
  return { ok: true, message: "Día borrado." };
}
