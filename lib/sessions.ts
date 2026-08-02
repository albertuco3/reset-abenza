import { getISODay, parseISO } from "date-fns";

export const SESSION_TYPES = [
  "cardio",
  "leg_strength",
  "leg_hypertrophy",
  "torso_hypertrophy",
  "torso_strength",
  "rest",
] as const;

export type SessionType = (typeof SESSION_TYPES)[number];
export type TorsoHypertrophyMode = "classic" | "emom";
export type TrainingModality = "strength" | "hypertrophy";

export const SESSION_LABELS: Record<SessionType, string> = {
  cardio: "Cardio",
  leg_strength: "Pierna fuerza",
  leg_hypertrophy: "Pierna hipertrofia",
  torso_hypertrophy: "Torso hipertrofia",
  torso_strength: "Torso fuerza",
  rest: "Descanso",
};

/** ISO day: 1=lunes … 7=domingo */
export function defaultSessionForDate(isoDate: string): SessionType {
  const day = getISODay(parseISO(isoDate));
  switch (day) {
    case 1:
    case 4:
      return "cardio";
    case 2:
      return "leg_strength";
    case 3:
      return "torso_hypertrophy";
    case 5:
      return "leg_hypertrophy";
    case 6:
      return "torso_strength";
    case 7:
    default:
      return "rest";
  }
}
