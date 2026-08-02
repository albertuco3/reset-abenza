/** min/km decimal → "m:ss" */
export function paceToMmSs(pace: number): string {
  if (!Number.isFinite(pace) || pace <= 0) return "";
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);
  if (seconds === 60) return `${minutes + 1}:00`;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** "m:ss" o minutos decimales → min/km decimal */
export function parsePaceInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.includes(":")) {
    const [m, s] = trimmed.split(":");
    const minutes = Number(m);
    const seconds = Number(s);
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;
    return minutes + seconds / 60;
  }
  const n = Number(trimmed.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** "hh:mm:ss" | "mm:ss" | minutos decimales → minutos totales */
export function parseDurationInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.includes(":")) {
    const parts = trimmed.split(":").map(Number);
    if (parts.some((p) => !Number.isFinite(p))) return null;
    if (parts.length === 3) {
      const [h, m, s] = parts;
      return h * 60 + m + s / 60;
    }
    if (parts.length === 2) {
      const [m, s] = parts;
      return m + s / 60;
    }
    return null;
  }
  const n = Number(trimmed.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "";
  const totalSeconds = Math.round(minutes * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function completeCardioTrio(input: {
  distance_km?: number;
  duration_min?: number;
  pace_min_per_km?: number;
}): { distance_km: number; duration_min: number; pace_min_per_km: number } | null {
  const { distance_km: d, duration_min: t, pace_min_per_km: p } = input;
  const hasD = d != null && d > 0;
  const hasT = t != null && t > 0;
  const hasP = p != null && p > 0;

  if (hasD && hasT) {
    return {
      distance_km: d!,
      duration_min: t!,
      pace_min_per_km: Number((t! / d!).toFixed(2)),
    };
  }
  if (hasD && hasP) {
    return {
      distance_km: d!,
      duration_min: Number((d! * p!).toFixed(2)),
      pace_min_per_km: p!,
    };
  }
  if (hasT && hasP) {
    return {
      distance_km: Number((t! / p!).toFixed(2)),
      duration_min: t!,
      pace_min_per_km: p!,
    };
  }
  return null;
}
