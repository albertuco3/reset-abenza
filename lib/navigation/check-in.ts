"use client";

import { useRouter } from "next/navigation";

/** Navega al check-in de una fecha (login si hace falta). */
export function useCheckInNavigation() {
  const router = useRouter();

  return (isoDate: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return;
    router.push(`/check-in?date=${isoDate}`);
  };
}

/** Extrae fullDate del índice activo de un clic en Recharts 3. */
export function fullDateFromChartClick(
  state: { activeIndex?: unknown; activeTooltipIndex?: unknown } | null | undefined,
  series: { fullDate: string }[],
): string | undefined {
  const raw = state?.activeIndex ?? state?.activeTooltipIndex;
  const idx =
    typeof raw === "number"
      ? raw
      : typeof raw === "string" && /^\d+$/.test(raw)
        ? Number(raw)
        : undefined;
  if (idx == null || idx < 0 || idx >= series.length) return undefined;
  return series[idx]?.fullDate;
}
