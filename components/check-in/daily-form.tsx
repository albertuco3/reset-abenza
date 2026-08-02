"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveCheckIn } from "@/lib/actions/check-in";
import { completeCardioTrio, paceToMmSs, parseDurationInput } from "@/lib/cardio";
import {
  SESSION_LABELS,
  SESSION_TYPES,
  defaultSessionForDate,
  type SessionType,
} from "@/lib/sessions";
import {
  checkInSchema,
  type CheckInFormValues,
  type CheckInParsed,
} from "@/lib/validations/check-in";
import { SpanishDatePicker } from "@/components/ui/spanish-date-picker";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      {children}
      {hint ? <span className="text-xs text-zinc-500">{hint}</span> : null}
    </label>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none focus:border-emerald-700";

export function DailyForm({ defaults }: { defaults: CheckInFormValues }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CheckInFormValues, unknown, CheckInParsed>({
    resolver: zodResolver(checkInSchema) as Resolver<
      CheckInFormValues,
      unknown,
      CheckInParsed
    >,
    defaultValues: defaults,
  });

  const { register, watch, setValue, handleSubmit } = form;
  const habitClean = watch("habit_clean");
  const habitTraining = watch("habit_training");
  const entryDate = watch("entry_date");
  const sessionType = watch("session_type") as SessionType;
  const torsoMode = watch("torso_hypertrophy_mode");
  const distance = watch("cardio_distance_km");
  const durationStr = watch("cardio_duration");

  useEffect(() => {
    if (!defaults.session_type && entryDate) {
      setValue("session_type", defaultSessionForDate(entryDate));
    }
  }, [defaults.session_type, entryDate, setValue]);

  const livePace = useMemo(() => {
    const duration = durationStr ? parseDurationInput(durationStr) : null;
    const trio = completeCardioTrio({
      distance_km: typeof distance === "number" ? distance : undefined,
      duration_min: duration ?? undefined,
    });
    return trio ? paceToMmSs(trio.pace_min_per_km) : null;
  }, [distance, durationStr]);

  function onSessionChange(next: SessionType) {
    setValue("session_type", next, { shouldDirty: true });
    if (next !== "rest") {
      setValue("habit_training", true, { shouldDirty: true });
    }
    if (next === "torso_hypertrophy" && !torsoMode) {
      setValue("torso_hypertrophy_mode", "emom", { shouldDirty: true });
    }
  }

  function onDateChange(value: string) {
    setValue("entry_date", value, { shouldDirty: true });
    // Solo auto-sugerir sesión si el usuario no ha tocado aún un día guardado distinto
    if (!defaults.entry_date || defaults.entry_date !== value) {
      onSessionChange(defaultSessionForDate(value));
    }
  }

  function onSubmit(values: CheckInParsed) {
    setFeedback(null);
    setError(null);
    startTransition(async () => {
      try {
        const result = await saveCheckIn(values);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setFeedback(result.message);
        router.refresh();
      } catch {
        setError("Error al guardar. Revisa la consola o inténtalo de nuevo.");
      }
    });
  }

  function onInvalid() {
    setError("Revisa los datos del formulario (algún campo no es válido).");
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="space-y-6 pb-28"
    >
      <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase">
          Día
        </h2>
        <Field label="Fecha">
          <SpanishDatePicker value={entryDate} onChange={onDateChange} />
        </Field>
        <Field label="Tipo de sesión" hint="Sugerido según el día de la semana; puedes cambiarlo">
          <select
            className={inputClass}
            value={sessionType}
            onChange={(e) => onSessionChange(e.target.value as SessionType)}
          >
            {SESSION_TYPES.map((type) => (
              <option key={type} value={type}>
                {SESSION_LABELS[type]}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase">
          Hábitos
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setValue("habit_clean", !habitClean, { shouldDirty: true })}
            className={`min-h-20 rounded-2xl px-3 py-4 text-sm font-semibold transition ${
              habitClean
                ? "bg-emerald-700 text-white"
                : "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200"
            }`}
          >
            Limpio
            <span className="mt-1 block text-xs font-normal opacity-80">
              0 alcohol · 0 tabaco
            </span>
          </button>
          <button
            type="button"
            onClick={() =>
              setValue("habit_training", !habitTraining, { shouldDirty: true })
            }
            className={`min-h-20 rounded-2xl px-3 py-4 text-sm font-semibold transition ${
              habitTraining
                ? "bg-emerald-700 text-white"
                : "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200"
            }`}
          >
            Entrenamiento
            <span className="mt-1 block text-xs font-normal opacity-80">
              Completado
            </span>
          </button>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase">
          Recuperación
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sueño">
            <input
              inputMode="numeric"
              className={inputClass}
              placeholder="1-10"
              {...register("sleep_quality", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Energía">
            <input
              inputMode="numeric"
              className={inputClass}
              placeholder="1-10"
              {...register("energy_level", { valueAsNumber: true })}
            />
          </Field>
        </div>
      </section>

      {(sessionType === "leg_strength" ||
        sessionType === "leg_hypertrophy") && (
        <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
          <h2 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase">
            Sentadilla ·{" "}
            {sessionType === "leg_strength" ? "Fuerza" : "Hipertrofia"}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kilos">
              <input
                inputMode="decimal"
                className={inputClass}
                {...register("squat_kg", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Reps (1ª serie)">
              <input
                inputMode="numeric"
                className={inputClass}
                {...register("squat_reps", { valueAsNumber: true })}
              />
            </Field>
          </div>
        </section>
      )}

      {sessionType === "torso_strength" && (
        <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
          <h2 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase">
            Dominadas lastradas · Fuerza
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Lastre (kg)" hint="Kilos añadidos">
              <input
                inputMode="decimal"
                className={inputClass}
                {...register("pull_up_kg", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Reps (1ª serie)">
              <input
                inputMode="numeric"
                className={inputClass}
                {...register("pull_up_reps", { valueAsNumber: true })}
              />
            </Field>
          </div>
        </section>
      )}

      {sessionType === "torso_hypertrophy" && (
        <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
          <h2 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase">
            Torso hipertrofia
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                setValue("torso_hypertrophy_mode", "classic", {
                  shouldDirty: true,
                })
              }
              className={`min-h-14 rounded-2xl text-sm font-semibold ${
                torsoMode === "classic"
                  ? "bg-emerald-700 text-white"
                  : "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200"
              }`}
            >
              Clásico
            </button>
            <button
              type="button"
              onClick={() =>
                setValue("torso_hypertrophy_mode", "emom", {
                  shouldDirty: true,
                })
              }
              className={`min-h-14 rounded-2xl text-sm font-semibold ${
                torsoMode === "emom"
                  ? "bg-emerald-700 text-white"
                  : "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200"
              }`}
            >
              EMOM
            </button>
          </div>

          {torsoMode === "classic" && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Field label="Dominadas" hint="Reps 1ª serie">
                <input
                  inputMode="numeric"
                  className={inputClass}
                  {...register("pull_up_reps", { valueAsNumber: true })}
                />
              </Field>
              <Field label="Flexiones" hint="Reps 1ª serie">
                <input
                  inputMode="numeric"
                  className={inputClass}
                  {...register("push_up_reps", { valueAsNumber: true })}
                />
              </Field>
            </div>
          )}

          {torsoMode === "emom" && (
            <div className="space-y-3 pt-1">
              <p className="text-xs text-zinc-500">
                Reps totales del bloque (30 series / 30&apos; por defecto).
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Dominadas (total)">
                  <input
                    inputMode="numeric"
                    className={inputClass}
                    {...register("emom_pull_up_reps", { valueAsNumber: true })}
                  />
                </Field>
                <Field label="Flexiones (total)">
                  <input
                    inputMode="numeric"
                    className={inputClass}
                    {...register("emom_push_up_reps", { valueAsNumber: true })}
                  />
                </Field>
              </div>
            </div>
          )}
        </section>
      )}

      {sessionType === "cardio" && (
        <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
          <h2 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase">
            Cardio
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Distancia (km)">
              <input
                inputMode="decimal"
                className={inputClass}
                {...register("cardio_distance_km", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Tiempo" hint="mm:ss o h:mm:ss">
              <input
                inputMode="numeric"
                placeholder="45:00"
                className={inputClass}
                {...register("cardio_duration")}
              />
            </Field>
          </div>
          <p className="text-sm text-zinc-600">
            Ritmo:{" "}
            <span className="font-semibold text-zinc-900">
              {livePace ? `${livePace} /km` : "—"}
            </span>
          </p>
        </section>
      )}

      {sessionType === "rest" && (
        <p className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-600">
          Día de descanso: no hace falta registrar entrenamiento.
        </p>
      )}

      <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
        <Field label="Notas">
          <textarea
            rows={2}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-emerald-700"
            {...register("notes")}
          />
        </Field>
      </section>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {feedback ? (
        <p className="text-sm text-emerald-700" role="status">
          {feedback}{" "}
          <button
            type="button"
            className="underline"
            onClick={() => router.push("/")}
          >
            Ir al dashboard
          </button>
        </p>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white/95 p-4 backdrop-blur">
        <button
          type="submit"
          disabled={pending}
          className="mx-auto flex h-12 w-full max-w-5xl items-center justify-center rounded-xl bg-emerald-800 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar check-in"}
        </button>
      </div>
    </form>
  );
}
