import { formatInTimeZone } from "date-fns-tz";
import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";

export const APP_TZ = "Europe/Madrid";

export function todayInMadrid(): string {
  return formatInTimeZone(new Date(), APP_TZ, "yyyy-MM-dd");
}

export function getResetStartDate(): string {
  return process.env.NEXT_PUBLIC_RESET_START_DATE ?? "2026-08-02";
}

/** Rango del heatmap: desde RESET_START_DATE hasta +364 días (año de reset). */
export function getResetYearRange(startDate = getResetStartDate()) {
  const start = parseISO(startDate);
  const end = addDays(start, 364);
  return { start, end, startDate, endDate: format(end, "yyyy-MM-dd") };
}

export function formatDisplayDate(isoDate: string): string {
  return format(parseISO(isoDate), "d MMM yyyy", { locale: es });
}

export function buildHeatmapGrid(startDate: string, endDate: string) {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const days = eachDayOfInterval({ start, end });
  const gridStart = startOfWeek(start, { weekStartsOn: 1 });
  const cells: { date: string | null }[] = [];

  let cursor = gridStart;
  while (cursor <= end || cells.length % 7 !== 0) {
    const iso = format(cursor, "yyyy-MM-dd");
    const inRange =
      differenceInCalendarDays(cursor, start) >= 0 &&
      differenceInCalendarDays(end, cursor) >= 0;
    cells.push({ date: inRange ? iso : null });
    cursor = addDays(cursor, 1);
    if (cells.length > 400) break;
  }

  const weeks: { date: string | null }[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return { days, weeks };
}
