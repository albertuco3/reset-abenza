import { CardioChart } from "@/components/charts/cardio-chart";
import { EmomChart } from "@/components/charts/emom-chart";
import { LiftComboChart } from "@/components/charts/lift-combo-chart";
import { RecoveryCharts } from "@/components/charts/recovery-charts";
import { HabitHeatmap } from "@/components/heatmap/habit-heatmap";
import { getDashboardData } from "@/lib/data/dashboard";
import { formatDisplayDate } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Año de reset desde {formatDisplayDate(data.resetStartDate)}
            {!user ? " · Solo lectura" : null}
          </p>
        </div>
        {user ? (
          <Link
            href="/check-in"
            className="inline-flex h-10 items-center rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white"
          >
            Check-in de hoy
          </Link>
        ) : null}
      </div>

      <HabitHeatmap
        habit="habit_clean"
        entries={data.entries}
        resetStartDate={data.resetStartDate}
      />
      <HabitHeatmap
        habit="habit_training"
        entries={data.entries}
        resetStartDate={data.resetStartDate}
      />
      <HabitHeatmap
        habit="habit_meditation"
        entries={data.entries}
        resetStartDate={data.resetStartDate}
      />
      <HabitHeatmap
        habit="habit_reading"
        entries={data.entries}
        resetStartDate={data.resetStartDate}
      />

      <LiftComboChart
        title="Sentadilla búlgara · Fuerza"
        subtitle="Barras = kg · línea = reps (1ª serie)"
        exercise="squat"
        modality="strength"
        data={data.strength}
      />
      <LiftComboChart
        title="Sentadilla búlgara · Hipertrofia"
        subtitle="Barras = kg · línea = reps (1ª serie)"
        exercise="squat"
        modality="hypertrophy"
        data={data.strength}
      />
      <LiftComboChart
        title="Dominadas lastradas · Fuerza"
        subtitle="Barras = kg de lastre · línea = reps"
        exercise="pull_up"
        modality="strength"
        data={data.strength}
        weightLabel="lastre kg"
      />
      <LiftComboChart
        title="Dominadas · Hipertrofia (clásico)"
        subtitle="Reps de la 1ª serie"
        exercise="pull_up"
        modality="hypertrophy"
        data={data.strength}
        showWeight={false}
        showReps
      />
      <LiftComboChart
        title="Flexiones en anillas · Hipertrofia (clásico)"
        subtitle="Reps de la 1ª serie"
        exercise="push_up"
        modality="hypertrophy"
        data={data.strength}
        showWeight={false}
        showReps
      />

      <EmomChart data={data.emom} />
      <CardioChart data={data.cardio} />
      <RecoveryCharts entries={data.entries} />
    </main>
  );
}
