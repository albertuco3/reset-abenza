"use client";

import { useMemo, useState } from "react";
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
import { formatDuration, paceToMmSs } from "@/lib/cardio";

export function CardioChart({
  data,
}: {
  data: {
    entry_date: string;
    distance_km: number;
    duration_min: number;
    pace_min_per_km: number;
  }[];
}) {
  const [minKm, setMinKm] = useState(0);

  const sorted = useMemo(
    () => [...data].sort((a, b) => a.entry_date.localeCompare(b.entry_date)),
    [data],
  );

  const kpis = useMemo(() => {
    if (!sorted.length) {
      return { totalKm: 0, longest: 0, bestPace: null as number | null };
    }
    const totalKm = sorted.reduce((acc, r) => acc + r.distance_km, 0);
    const longest = Math.max(...sorted.map((r) => r.distance_km));
    const comparable = sorted.filter((r) => r.distance_km >= 5);
    const bestPace = comparable.length
      ? Math.min(...comparable.map((r) => r.pace_min_per_km))
      : null;
    return { totalKm, longest, bestPace };
  }, [sorted]);

  const series = useMemo(
    () =>
      sorted.map((r) => ({
        date: r.entry_date.slice(5),
        km: r.distance_km,
        pace: r.distance_km >= minKm ? r.pace_min_per_km : null,
        fullDate: r.entry_date,
        duration: formatDuration(r.duration_min),
        paceLabel: paceToMmSs(r.pace_min_per_km),
      })),
    [sorted, minKm],
  );

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Cardio</h2>
          <p className="text-xs text-zinc-500">
            Barras = km · línea = ritmo (min/km)
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-zinc-600">
          Ritmo si ≥
          <select
            value={minKm}
            onChange={(e) => setMinKm(Number(e.target.value))}
            className="rounded-lg border border-zinc-300 bg-white px-2 py-1"
          >
            <option value={0}>0 km</option>
            <option value={3}>3 km</option>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
          </select>
        </label>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <Kpi label="Km totales" value={kpis.totalKm.toFixed(1)} />
        <Kpi label="Más larga" value={`${kpis.longest.toFixed(1)} km`} />
        <Kpi
          label="Mejor ritmo ≥5km"
          value={kpis.bestPace ? `${paceToMmSs(kpis.bestPace)}/km` : "—"}
        />
      </div>

      {series.length === 0 ? (
        <p className="flex h-40 items-center justify-center text-sm text-zinc-500">
          Sin salidas registradas.
        </p>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <ComposedChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis
                yAxisId="km"
                tick={{ fontSize: 11 }}
                width={32}
                label={{ value: "km", position: "insideTopLeft", offset: 10, fontSize: 10 }}
              />
              <YAxis
                yAxisId="pace"
                orientation="right"
                reversed
                tick={{ fontSize: 11 }}
                width={36}
                domain={["auto", "auto"]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0]?.payload;
                  return (
                    <div className="rounded-lg bg-white px-3 py-2 text-xs shadow ring-1 ring-zinc-200">
                      <p className="font-semibold">{row.fullDate}</p>
                      <p>{row.km} km · {row.duration}</p>
                      <p>{row.paceLabel} /km</p>
                    </div>
                  );
                }}
              />
              <Legend />
              <Bar
                yAxisId="km"
                dataKey="km"
                name="Distancia"
                fill="#a7f3d0"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="pace"
                type="monotone"
                dataKey="pace"
                name="Ritmo"
                stroke="#065f46"
                strokeWidth={2}
                connectNulls
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-50 px-3 py-2 ring-1 ring-zinc-100">
      <p className="text-[10px] tracking-wide text-zinc-500 uppercase">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  );
}
