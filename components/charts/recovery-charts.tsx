"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  fullDateFromChartClick,
  useCheckInNavigation,
} from "@/lib/navigation/check-in";
import type { DailyEntry } from "@/lib/types";

export function RecoveryCharts({ entries }: { entries: DailyEntry[] }) {
  const goToCheckIn = useCheckInNavigation();
  const series = useMemo(
    () =>
      [...entries]
        .sort((a, b) => a.entry_date.localeCompare(b.entry_date))
        .map((e) => ({
          date: e.entry_date.slice(5),
          fullDate: e.entry_date,
          sleep: e.sleep_quality,
          energy: e.energy_level,
        })),
    [entries],
  );

  const hasAny = series.some((s) => s.sleep != null || s.energy != null);

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-zinc-900">Recuperación</h2>
        <p className="text-xs text-zinc-500">Sueño · energía · toca para editar</p>
      </div>
      {!hasAny ? (
        <p className="flex h-40 items-center justify-center text-sm text-zinc-500">
          Sin métricas de recuperación.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Mini
            title="Sueño (1-10)"
            dataKey="sleep"
            data={series}
            color="#3f6212"
            onPointClick={goToCheckIn}
          />
          <Mini
            title="Energía (1-10)"
            dataKey="energy"
            data={series}
            color="#365314"
            onPointClick={goToCheckIn}
          />
        </div>
      )}
    </section>
  );
}

function Mini({
  title,
  dataKey,
  data,
  color,
  onPointClick,
}: {
  title: string;
  dataKey: "sleep" | "energy";
  data: {
    date: string;
    fullDate: string;
    sleep: number | null;
    energy: number | null;
  }[];
  color: string;
  onPointClick: (isoDate: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-zinc-600">{title}</p>
      <div className="h-36 w-full cursor-pointer">
        <ResponsiveContainer>
          <LineChart
            data={data}
            onClick={(state) => {
              const date = fullDateFromChartClick(state, data);
              if (date) onPointClick(date);
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} width={28} domain={[1, 10]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              connectNulls
              dot={{ r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
