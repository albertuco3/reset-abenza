"use client";

import { useMemo, useState } from "react";
import { buildHeatmapGrid, formatDisplayDate, getResetYearRange } from "@/lib/dates";
import { useCheckInNavigation } from "@/lib/navigation/check-in";
import type { DailyEntry } from "@/lib/types";

type HabitKey = "habit_clean" | "habit_training";

const LABELS: Record<HabitKey, string> = {
  habit_clean: "Limpio",
  habit_training: "Entrenamiento",
};

export function HabitHeatmap({
  habit,
  entries,
  resetStartDate,
}: {
  habit: HabitKey;
  entries: DailyEntry[];
  resetStartDate: string;
}) {
  const goToCheckIn = useCheckInNavigation();
  const { startDate, endDate } = getResetYearRange(resetStartDate);
  const [tip, setTip] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const e of entries) map.set(e.entry_date, e[habit]);
    return map;
  }, [entries, habit]);

  const { weeks } = useMemo(
    () => buildHeatmapGrid(startDate, endDate),
    [startDate, endDate],
  );

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            {LABELS[habit]}
          </h2>
          <p className="text-xs text-zinc-500">
            Heatmap del año de reset · toca un día para editar
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <i className="inline-block h-2.5 w-2.5 rounded-sm bg-zinc-100 ring-1 ring-zinc-200" />
            vacío
          </span>
          <span className="inline-flex items-center gap-1">
            <i className="inline-block h-2.5 w-2.5 rounded-sm bg-rose-200" /> no
          </span>
          <span className="inline-flex items-center gap-1">
            <i className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-600" /> sí
          </span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((cell, di) => {
                if (!cell.date) {
                  return (
                    <div
                      key={`${wi}-${di}`}
                      className="h-3 w-3 rounded-[3px] bg-transparent"
                    />
                  );
                }
                const value = byDate.get(cell.date);
                const color =
                  value === undefined
                    ? "bg-zinc-100 ring-1 ring-zinc-200"
                    : value
                      ? "bg-emerald-600"
                      : "bg-rose-200";
                return (
                  <button
                    key={cell.date}
                    type="button"
                    title={`${cell.date} · editar`}
                    className={`h-3 w-3 rounded-[3px] ${color} transition hover:ring-2 hover:ring-emerald-700/50`}
                    onMouseEnter={() =>
                      setTip(
                        `${formatDisplayDate(cell.date!)} · ${
                          value === undefined
                            ? "sin registro"
                            : value
                              ? "sí"
                              : "no"
                        } · tocar para editar`,
                      )
                    }
                    onMouseLeave={() => setTip(null)}
                    onClick={() => goToCheckIn(cell.date!)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 min-h-5 text-xs text-zinc-600">{tip ?? " "}</p>
    </section>
  );
}
