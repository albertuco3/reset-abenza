export const SET_COUNT = 4;
export const SET_SLOTS = [1, 2, 3, 4] as const;
export const WEIGHT_STEP_KG = 2.5;
export const REP_RESET = 10;
export const REP_CAP = 13;

export type FourSets = [number, number, number, number];
export type SetSlot = (typeof SET_SLOTS)[number];

export type LastStrengthSession = {
  repsPerSet: FourSets;
  weightKg: number | null;
};

export type StrengthRecommendation = {
  lastRepsPerSet: FourSets;
  lastTotal: number;
  lastWeightKg: number | null;
  suggestedReps: number;
  suggestedWeightKg: number | null;
  kind: "reps" | "weight";
};

export function sumSets(sets: readonly number[]): number {
  return sets.reduce((total, n) => total + n, 0);
}

export function parseFourSets(raw: unknown): FourSets | null {
  if (!Array.isArray(raw) || raw.length !== SET_COUNT) return null;
  const nums = raw.map((n) => Number(n));
  if (nums.some((n) => !Number.isInteger(n) || n < 0)) return null;
  return nums as FourSets;
}

export function recommendNextSession(
  last: LastStrengthSession,
): StrengthRecommendation {
  const lastTotal = sumSets(last.repsPerSet);
  const targetReps = Math.floor(lastTotal / SET_COUNT) + 1;
  const hasWeight = last.weightKg != null;

  if (hasWeight && targetReps >= REP_CAP) {
    const nextWeight =
      Math.round((last.weightKg! + WEIGHT_STEP_KG) * 10) / 10;
    return {
      lastRepsPerSet: last.repsPerSet,
      lastTotal,
      lastWeightKg: last.weightKg,
      suggestedReps: REP_RESET,
      suggestedWeightKg: nextWeight,
      kind: "weight",
    };
  }

  return {
    lastRepsPerSet: last.repsPerSet,
    lastTotal,
    lastWeightKg: last.weightKg,
    suggestedReps: targetReps,
    suggestedWeightKg: last.weightKg,
    kind: "reps",
  };
}

export function formatKg(kg: number): string {
  return kg.toLocaleString("es-ES", { maximumFractionDigits: 2 });
}

export function formatRecommendation(rec: StrengthRecommendation): string {
  const lastSets = rec.lastRepsPerSet.join("-");
  const lastWeight =
    rec.lastWeightKg != null
      ? ` a ${formatKg(rec.lastWeightKg)} kg`
      : "";
  const lastPart = `Última vez: ${lastSets} (${rec.lastTotal})${lastWeight}.`;

  if (rec.kind === "weight" && rec.suggestedWeightKg != null) {
    return `${lastPart} Hoy: 4×${rec.suggestedReps} a ${formatKg(rec.suggestedWeightKg)} kg (sube 2,5 kg)`;
  }

  if (rec.suggestedWeightKg != null) {
    return `${lastPart} Hoy: 4×${rec.suggestedReps} al mismo peso`;
  }

  return `${lastPart} Hoy: 4×${rec.suggestedReps}`;
}

export type StrengthRecommendations = {
  squat_strength: StrengthRecommendation | null;
  squat_hypertrophy: StrengthRecommendation | null;
  pull_up_strength: StrengthRecommendation | null;
  pull_up_hypertrophy: StrengthRecommendation | null;
  push_up_hypertrophy: StrengthRecommendation | null;
};

export const EMPTY_RECOMMENDATIONS: StrengthRecommendations = {
  squat_strength: null,
  squat_hypertrophy: null,
  pull_up_strength: null,
  pull_up_hypertrophy: null,
  push_up_hypertrophy: null,
};
