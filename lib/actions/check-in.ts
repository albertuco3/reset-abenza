"use server";

import { revalidatePath } from "next/cache";
import { completeCardioTrio, parseDurationInput } from "@/lib/cardio";
import { createClient } from "@/lib/supabase/server";
import type { EmomExercise, StrengthExercise } from "@/lib/types";
import type { TrainingModality } from "@/lib/sessions";
import { checkInSchema, type CheckInParsed } from "@/lib/validations/check-in";

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
};

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
    if (data.squat_kg != null || data.squat_reps != null) {
      if (data.squat_kg == null) {
        return { ok: false, message: "Sentadilla: indica los kilos." };
      }
      strengthRows.push({
        daily_entry_id: entry.id,
        user_id: user.id,
        exercise: "squat",
        modality,
        weight_kg: data.squat_kg,
        reps: data.squat_reps ?? null,
      });
    }
  }

  if (data.session_type === "torso_strength") {
    if (data.pull_up_kg != null || data.pull_up_reps != null) {
      if (data.pull_up_kg == null) {
        return {
          ok: false,
          message: "Dominadas lastradas: indica los kg de lastre.",
        };
      }
      strengthRows.push({
        daily_entry_id: entry.id,
        user_id: user.id,
        exercise: "pull_up",
        modality: "strength",
        weight_kg: data.pull_up_kg,
        reps: data.pull_up_reps ?? null,
      });
    }
  }

  if (
    data.session_type === "torso_hypertrophy" &&
    data.torso_hypertrophy_mode === "classic"
  ) {
    if (data.pull_up_reps != null) {
      strengthRows.push({
        daily_entry_id: entry.id,
        user_id: user.id,
        exercise: "pull_up",
        modality: "hypertrophy",
        weight_kg: null,
        reps: data.pull_up_reps,
      });
    }
    if (data.push_up_reps != null) {
      strengthRows.push({
        daily_entry_id: entry.id,
        user_id: user.id,
        exercise: "push_up",
        modality: "hypertrophy",
        weight_kg: null,
        reps: data.push_up_reps,
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
