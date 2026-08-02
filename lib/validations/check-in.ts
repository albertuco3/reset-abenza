import { z } from "zod";
import { SESSION_TYPES } from "@/lib/sessions";

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

export const checkInSchema = z
  .object({
    entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    habit_clean: z.boolean(),
    habit_training: z.boolean(),
    session_type: z.enum(SESSION_TYPES),
    torso_hypertrophy_mode: z.enum(["classic", "emom"]).optional(),
    sleep_quality: optNumber(z.number().int().min(1).max(10)),
    energy_level: optNumber(z.number().int().min(1).max(10)),
    squat_kg: optNumber(z.number().positive().max(999)),
    squat_reps: optNumber(z.number().int().min(0).max(999)),
    pull_up_kg: optNumber(z.number().min(0).max(999)),
    pull_up_reps: optNumber(z.number().int().min(0).max(999)),
    push_up_reps: optNumber(z.number().int().min(0).max(999)),
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
  });

export type CheckInFormValues = z.input<typeof checkInSchema>;
export type CheckInParsed = z.output<typeof checkInSchema>;
