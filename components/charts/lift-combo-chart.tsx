"use client";

import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { StrengthExercise } from "@/lib/types";
import type { TrainingModality } from "@/lib/sessions";
import {
  fullDateFromChartClick,
  useCheckInNavigation,
} from "@/lib/navigation/check-in";

type Row = {
  entry_date: string;
  exercise: StrengthExercise;
  modality: TrainingModality;
  weight_kg: number | null;
  reps: number | null;
  reps_per_set: number[] | null;
};

export function LiftComboChart({
  title,
  subtitle,
  exercise,
  modality,
  data,
  weightLabel = "kg",
  showWeight = true,
  showReps = true,
}: {
  title: string;
  subtitle: string;
  exercise: StrengthExercise;
  modality: TrainingModality;
  data: Row[];
  weightLabel?: string;
  showWeight?: boolean;
  showReps?: boolean;
}) {
  const goToCheckIn = useCheckInNavigation();
  const series = useMemo(
    () =>
      data
        .filter((d) => d.exercise === exercise && d.modality === modality)
        .sort((a, b) => a.entry_date.localeCompare(b.entry_date))
        .map((d) => ({
          date: d.entry_date.slice(5),
          fullDate: d.entry_date,
          kg: d.weight_kg,
          reps: d.reps,
          sets:
            Array.isArray(d.reps_per_set) && d.reps_per_set.length === 4
              ? d.reps_per_set
              : null,
        })),
    [data, exercise, modality],
  );

  const hasData = series.some(
    (s) => (showWeight && s.kg != null) || (showReps && s.reps != null),
  );

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        <p className="text-xs text-zinc-500">
          {subtitle} · toca un punto para editar
        </p>
      </div>
      {!hasData ? (
        <p className="flex h-40 items-center justify-center text-sm text-zinc-500">
          Sin datos aún.
        </p>
      ) : (
        <div className="h-56 w-full cursor-pointer">
          <ResponsiveContainer>
            <ComposedChart
              data={series}
              onClick={(state) => {
                const date = fullDateFromChartClick(state, series);
                if (date) goToCheckIn(date);
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              {showWeight ? (
                <YAxis
                  yAxisId="kg"
                  tick={{ fontSize: 11 }}
                  width={36}
                  label={{
                    value: weightLabel,
                    position: "insideTopLeft",
                    offset: 8,
                    fontSize: 10,
                  }}
                />
              ) : (
                <YAxis yAxisId="reps" tick={{ fontSize: 11 }} width={32} />
              )}
              {showWeight && showReps ? (
                <YAxis
                  yAxisId="reps"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                  width={32}
                />
              ) : null}
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0]?.payload;
                  return (
                    <div className="rounded-lg bg-white px-3 py-2 text-xs shadow ring-1 ring-zinc-200">
                      <p className="font-semibold">{row.fullDate}</p>
                      {row.kg != null ? (
                        <p>
                          {weightLabel}: {row.kg}
                        </p>
                      ) : null}
                      {row.sets ? (
                        <p>
                          Reps: {row.sets.join("+")} = {row.reps}
                        </p>
                      ) : row.reps != null ? (
                        <p>Reps: {row.reps}</p>
                      ) : null}
                    </div>
                  );
                }}
              />
              <Legend />
              {showWeight ? (
                <Bar
                  yAxisId="kg"
                  dataKey="kg"
                  name={weightLabel}
                  fill="#a7f3d0"
                  radius={[4, 4, 0, 0]}
                />
              ) : null}
              {showReps ? (
                <Line
                  yAxisId="reps"
                  type="monotone"
                  dataKey="reps"
                  name="Reps"
                  stroke="#065f46"
                  strokeWidth={2}
                  connectNulls
                  dot={{ r: 3 }}
                />
              ) : null}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
