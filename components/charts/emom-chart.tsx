"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EmomExercise } from "@/lib/types";
import {
  fullDateFromChartClick,
  useCheckInNavigation,
} from "@/lib/navigation/check-in";

export function EmomChart({
  data,
}: {
  data: {
    entry_date: string;
    exercise: EmomExercise;
    total_reps: number;
    duration_minutes: number;
  }[];
}) {
  const goToCheckIn = useCheckInNavigation();
  const series = useMemo(() => {
    const byDate = new Map<
      string,
      { date: string; fullDate: string; pull_up?: number; push_up?: number }
    >();

    for (const row of data) {
      const current = byDate.get(row.entry_date) ?? {
        date: row.entry_date.slice(5),
        fullDate: row.entry_date,
      };
      current[row.exercise] = row.total_reps;
      byDate.set(row.entry_date, current);
    }

    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [data]);

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-zinc-900">EMOM</h2>
        <p className="text-xs text-zinc-500">
          Reps totales por bloque (dominadas / flexiones en anillas) · toca
          para editar
        </p>
      </div>
      {series.length === 0 ? (
        <p className="flex h-40 items-center justify-center text-sm text-zinc-500">
          Sin EMOM registrados.
        </p>
      ) : (
        <div className="h-56 w-full cursor-pointer">
          <ResponsiveContainer>
            <LineChart
              data={series}
              onClick={(state) => {
                const date = fullDateFromChartClick(state, series);
                if (date) goToCheckIn(date);
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={36} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="pull_up"
                name="Dominadas"
                stroke="#115e59"
                strokeWidth={2}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="push_up"
                name="Flexiones anillas"
                stroke="#3f6212"
                strokeWidth={2}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
