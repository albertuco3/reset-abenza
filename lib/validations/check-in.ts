import { z } from "zod";
import { SESSION_TYPES } from "@/lib/sessions";
import { SET_SLOTS, parseFourSets, type FourSets } from "@/lib/progression";

/** Vacío / NaN / ausente → undefined (compatible con Zod 4 + RHF valueAsNumber). */
function optNumber<T extends z.ZodType<number>>(schema: T) {
  return z.preprocess((value) => {
    if (value === "" || value == null) return undefined;
    if (typeof value === "number" && Number.isNaN(value)) return undefined;
    if (typeof value === "string") {
      const n = Number(value.replace(",", "."));
      return Number.isFinite(n) ? n : undefined;
    }
    return value;
  }, schema.optional());
}

const setRep = optNumber(z.number().int().min(0).max(999));

export type SetPrefix = "squat_set" | "pull_up_set" | "push_up_set";

export function getSetValues(
  data: Record<string, unknown>,
  prefix: SetPrefix,
): (number | undefined)[] {
  return SET_SLOTS.map((slot) => {
    const value = data[`${prefix}_${slot}`];
    return typeof value === "number" ? value : undefined;
  });
}

export function completeSetsOrNull(
  data: Record<string, unknown>,
  prefix: SetPrefix,
): FourSets | null {
  return parseFourSets(getSetValues(data, prefix));
}

function anyDefined(values: (number | undefined)[]): boolean {
  return values.some((value) => value != null);
}

function allDefined(values: (number | undefined)[]): boolean {
  return values.every((value) => value != null);
}

function requireFourSets(
  ctx: z.RefinementCtx,
  sets: (number | undefined)[],
  prefix: SetPrefix,
  label: string,
) {
  if (anyDefined(sets) && !allDefined(sets)) {
    ctx.addIssue({
      code: "custom",
      message: `${label}: indica las 4 series.`,
      path: [`${prefix}_1`],
    });
  }
}

export const checkInSchema = z
  .object({
    entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    habit_clean: z.boolean(),
    habit_training: z.boolean(),
    habit_meditation: z.boolean(),
    habit_reading: z.boolean(),
    session_type: z.enum(SESSION_TYPES),
    torso_hypertrophy_mode: z.enum(["classic", "emom"]).optional(),
    sleep_quality: optNumber(z.number().int().min(1).max(10)),
    energy_level: optNumber(z.number().int().min(1).max(10)),
    squat_kg: optNumber(z.number().positive().max(999)),
    squat_set_1: setRep,
    squat_set_2: setRep,
    squat_set_3: setRep,
    squat_set_4: setRep,
    pull_up_kg: optNumber(z.number().min(0).max(999)),
    pull_up_set_1: setRep,
    pull_up_set_2: setRep,
    pull_up_set_3: setRep,
    pull_up_set_4: setRep,
    push_up_set_1: setRep,
    push_up_set_2: setRep,
    push_up_set_3: setRep,
    push_up_set_4: setRep,
    emom_pull_up_reps: optNumber(z.number().int().min(0).max(4999)),
    emom_push_up_reps: optNumber(z.number().int().min(0).max(4999)),
    emom_duration_minutes: optNumber(z.number().int().min(1).max(120)),
    cardio_distance_km: optNumber(z.number().positive().max(499)),
    cardio_duration: z.string().optional(),
    notes: z.string().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.session_type === "torso_hypertrophy" &&
      !data.torso_hypertrophy_mode
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Elige Clásico o EMOM",
        path: ["torso_hypertrophy_mode"],
      });
    }

    if (
      data.session_type === "leg_strength" ||
      data.session_type === "leg_hypertrophy"
    ) {
      const sets = getSetValues(data, "squat_set");
      const touched = data.squat_kg != null || anyDefined(sets);
      if (touched) {
        if (data.squat_kg == null) {
          ctx.addIssue({
            code: "custom",
            message: "Sentadilla búlgara: indica los kilos.",
            path: ["squat_kg"],
          });
        }
        if (!allDefined(sets)) {
          ctx.addIssue({
            code: "custom",
            message: "Sentadilla búlgara: indica las 4 series.",
            path: ["squat_set_1"],
          });
        }
      }
    }

    if (data.session_type === "torso_strength") {
      const sets = getSetValues(data, "pull_up_set");
      const touched = data.pull_up_kg != null || anyDefined(sets);
      if (touched) {
        if (data.pull_up_kg == null) {
          ctx.addIssue({
            code: "custom",
            message: "Dominadas lastradas: indica los kg de lastre.",
            path: ["pull_up_kg"],
          });
        }
        if (!allDefined(sets)) {
          ctx.addIssue({
            code: "custom",
            message: "Dominadas lastradas: indica las 4 series.",
            path: ["pull_up_set_1"],
          });
        }
      }
    }

    if (
      data.session_type === "torso_hypertrophy" &&
      data.torso_hypertrophy_mode === "classic"
    ) {
      requireFourSets(
        ctx,
        getSetValues(data, "pull_up_set"),
        "pull_up_set",
        "Dominadas",
      );
      requireFourSets(
        ctx,
        getSetValues(data, "push_up_set"),
        "push_up_set",
        "Flexiones en anillas",
      );
    }
  });

export type CheckInFormValues = z.input<typeof checkInSchema>;
export type CheckInParsed = z.output<typeof checkInSchema>;
