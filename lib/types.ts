import type {
  SessionType,
  TorsoHypertrophyMode,
  TrainingModality,
} from "@/lib/sessions";

export type StrengthExercise =
  | "squat"
  | "deadlift"
  | "leg_press"
  | "pull_up"
  | "push_up";

export type EmomExercise = "pull_up" | "push_up";

export type DailyEntry = {
  id: string;
  user_id: string;
  entry_date: string;
  habit_clean: boolean;
  habit_training: boolean;
  session_type: SessionType | null;
  torso_hypertrophy_mode: TorsoHypertrophyMode | null;
  resting_hr: number | null;
  sleep_quality: number | null;
  energy_level: number | null;
  notes: string | null;
};

export type StrengthLog = {
  id: string;
  daily_entry_id: string;
  user_id: string;
  exercise: StrengthExercise;
  modality: TrainingModality;
  weight_kg: number | null;
  reps: number | null;
};

export type EmomLog = {
  id: string;
  daily_entry_id: string;
  user_id: string;
  exercise: EmomExercise;
  duration_minutes: number;
  total_reps: number;
};

export type CardioLog = {
  id: string;
  daily_entry_id: string;
  user_id: string;
  activity_type: string;
  distance_km: number;
  duration_min: number;
  pace_min_per_km: number;
};

export type DashboardData = {
  entries: DailyEntry[];
  strength: (StrengthLog & { entry_date: string })[];
  emom: (EmomLog & { entry_date: string })[];
  cardio: (CardioLog & { entry_date: string })[];
  resetStartDate: string;
};
