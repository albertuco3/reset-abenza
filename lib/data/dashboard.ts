import { getResetStartDate, getResetYearRange } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { DashboardData, StrengthLog } from "@/lib/types";
import type { TrainingModality } from "@/lib/sessions";

export async function getDashboardData(): Promise<DashboardData> {
  const resetStartDate = getResetStartDate();
  const { startDate, endDate } = getResetYearRange(resetStartDate);
  const empty: DashboardData = {
    entries: [],
    strength: [],
    emom: [],
    cardio: [],
    resetStartDate,
  };

  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("daily_entries")
    .select("*")
    .gte("entry_date", startDate)
    .lte("entry_date", endDate)
    .order("entry_date", { ascending: true });

  const entryList = entries ?? [];
  const entryIds = entryList.map((e) => e.id);
  const dateById = Object.fromEntries(
    entryList.map((e) => [e.id, e.entry_date as string]),
  );

  if (!entryIds.length) {
    return { ...empty, entries: entryList };
  }

  const [{ data: strength }, { data: emom }, { data: cardio }] =
    await Promise.all([
      supabase.from("strength_logs").select("*").in("daily_entry_id", entryIds),
      supabase.from("emom_logs").select("*").in("daily_entry_id", entryIds),
      supabase.from("cardio_logs").select("*").in("daily_entry_id", entryIds),
    ]);

  return {
    resetStartDate,
    entries: entryList,
    strength: (strength ?? []).map((s) => ({
      ...(s as StrengthLog),
      weight_kg: s.weight_kg != null ? Number(s.weight_kg) : null,
      reps: s.reps != null ? Number(s.reps) : null,
      reps_per_set: Array.isArray(s.reps_per_set)
        ? s.reps_per_set.map((n: unknown) => Number(n))
        : null,
      modality: (s.modality ?? "strength") as TrainingModality,
      entry_date: dateById[s.daily_entry_id],
    })),
    emom: (emom ?? []).map((e) => ({
      ...e,
      total_reps: Number(e.total_reps),
      duration_minutes: Number(e.duration_minutes),
      entry_date: dateById[e.daily_entry_id],
    })),
    cardio: (cardio ?? []).map((c) => ({
      ...c,
      distance_km: Number(c.distance_km),
      duration_min: Number(c.duration_min),
      pace_min_per_km: Number(c.pace_min_per_km),
      entry_date: dateById[c.daily_entry_id],
    })),
  };
}
