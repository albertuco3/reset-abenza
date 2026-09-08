"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveCheckIn, loadCheckInForDate, deleteCheckInDay } from "@/lib/actions/check-in";
import { completeCardioTrio, paceToMmSs, parseDurationInput } from "@/lib/cardio";
import {
  formatRecommendation,
  SET_SLOTS,
  type StrengthRecommendation,
  type StrengthRecommendations,
} from "@/lib/progression";
import {
  SESSION_LABELS,
  SESSION_TYPES,
  type SessionType,
} from "@/lib/sessions";
import {
  checkInSchema,
  type CheckInFormValues,
  type CheckInParsed,
  type SetPrefix,
} from "@/lib/validations/check-in";
import { SpanishDatePicker } from "@/components/ui/spanish-date-picker";
import { formatDisplayDate } from "@/lib/dates";

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

type SetFieldName = `${SetPrefix}_${(typeof SET_SLOTS)[number]}`;

function asOptNumber(value: unknown): number | undefined {
  return typeof value === "number" && !Number.isNaN(value) ? value : undefined;
}

function RecommendationHint({ rec }: { rec: StrengthRecommendation | null }) {
  if (!rec) return null;
  return (
    <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
      {formatRecommendation(rec)}
    </p>
  );
}

function SetsFields({
  prefix,
  register,
  values,
}: {
  prefix: SetPrefix;
  register: UseFormRegister<CheckInFormValues>;
  values: unknown[];
}) {
  const numbers = values.map(asOptNumber);
  const complete = numbers.every((value) => value != null);
  const total = complete
    ? numbers.reduce<number>((sum, value) => sum + (value ?? 0), 0)
    : null;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {SET_SLOTS.map((slot) => {
          const name: SetFieldName = `${prefix}_${slot}`;
          return (
            <Field key={name} label={`S${slot}`}>
              <input
                inputMode="numeric"
                className={inputClass}
                {...register(name, { valueAsNumber: true })}
              />
            </Field>
          );
        })}
      </div>
      <p className="text-sm text-zinc-600">
        Total:{" "}
        <span className="font-semibold text-zinc-900">
          {complete ? `${numbers.join("+")} = ${total}` : "—"}
        </span>
      </p>
    </div>
  );
}

export function DailyForm({
  defaults,
  initiallyExists = false,
  recommendations: initialRecommendations,
}: {
  defaults: CheckInFormValues;
  initiallyExists?: boolean;
  recommendations: StrengthRecommendations;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loadingDate, setLoadingDate] = useState(false);
  const [exists, setExists] = useState(initiallyExists);
  const [recommendations, setRecommendations] = useState(initialRecommendations);
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

  const { register, watch, setValue, handleSubmit, reset } = form;
  const habitClean = watch("habit_clean");
  const habitTraining = watch("habit_training");
  const habitMeditation = watch("habit_meditation");
  const habitReading = watch("habit_reading");
  const entryDate = watch("entry_date");
  const sessionType = watch("session_type") as SessionType;
  const torsoMode = watch("torso_hypertrophy_mode");
  const distance = watch("cardio_distance_km");
  const durationStr = watch("cardio_duration");
  const squatSets = [
    watch("squat_set_1"),
    watch("squat_set_2"),
    watch("squat_set_3"),
    watch("squat_set_4"),
  ];
  const pullUpSets = [
    watch("pull_up_set_1"),
    watch("pull_up_set_2"),
    watch("pull_up_set_3"),
    watch("pull_up_set_4"),
  ];
  const pushUpSets = [
    watch("push_up_set_1"),
    watch("push_up_set_2"),
    watch("push_up_set_3"),
    watch("push_up_set_4"),
  ];

  useEffect(() => {
    reset(defaults);
    setExists(initiallyExists);
    setRecommendations(initialRecommendations);
  }, [defaults, initiallyExists, initialRecommendations, reset]);

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

  async function onDateChange(value: string) {
    if (!value || value === entryDate) return;
    setFeedback(null);
    setError(null);
    setLoadingDate(true);
    try {
      const loaded = await loadCheckInForDate(value);
      if (!loaded.ok) {
        setError(loaded.message);
        return;
      }
      reset(loaded.values);
      setExists(loaded.exists);
      setRecommendations(loaded.recommendations);
      router.replace(`/check-in?date=${value}`, { scroll: false });
    } catch {
      setError("No se pudo cargar esa fecha.");
    } finally {
      setLoadingDate(false);
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
        setExists(true);
        setFeedback(result.message);
        router.replace(`/check-in?date=${values.entry_date}`, { scroll: false });
        router.refresh();
      } catch {
        setError("Error al guardar. Revisa la consola o inténtalo de nuevo.");
      }
    });
  }

  function onDelete() {
    if (!entryDate) return;
    const ok = window.confirm(
      `¿Borrar todos los datos del ${formatDisplayDate(entryDate)}? Esta acción no se puede deshacer.`,
    );
    if (!ok) return;

    setFeedback(null);
    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteCheckInDay(entryDate);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        const loaded = await loadCheckInForDate(entryDate);
        if (loaded.ok) {
          reset(loaded.values);
          setExists(false);
          setRecommendations(loaded.recommendations);
        }
        setFeedback(result.message);
        router.refresh();
      } catch {
        setError("No se pudo borrar el día.");
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase">
            Día
          </h2>
          {exists ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
              Editando {entryDate ? formatDisplayDate(entryDate) : ""}
            </span>
          ) : null}
        </div>
        <Field label="Fecha">
          <SpanishDatePicker
            value={entryDate}
            onChange={onDateChange}
            className={loadingDate ? "pointer-events-none opacity-60" : undefined}
          />
        </Field>
        {loadingDate ? (
          <p className="text-xs text-zinc-500">Cargando datos del día…</p>
        ) : null}
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
          <button
            type="button"
            onClick={() =>
              setValue("habit_meditation", !habitMeditation, {
                shouldDirty: true,
              })
            }
            className={`min-h-20 rounded-2xl px-3 py-4 text-sm font-semibold transition ${
              habitMeditation
                ? "bg-emerald-700 text-white"
                : "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200"
            }`}
          >
            Meditación
            <span className="mt-1 block text-xs font-normal opacity-80">
              Completada
            </span>
          </button>
          <button
            type="button"
            onClick={() =>
              setValue("habit_reading", !habitReading, { shouldDirty: true })
            }
            className={`min-h-20 rounded-2xl px-3 py-4 text-sm font-semibold transition ${
              habitReading
                ? "bg-emerald-700 text-white"
                : "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200"
            }`}
          >
            Lectura
            <span className="mt-1 block text-xs font-normal opacity-80">
              Completada
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
            Sentadilla búlgara ·{" "}
            {sessionType === "leg_strength" ? "Fuerza" : "Hipertrofia"}
          </h2>
          <RecommendationHint
            rec={
              sessionType === "leg_strength"
                ? recommendations.squat_strength
                : recommendations.squat_hypertrophy
            }
          />
          <Field label="Kilos">
            <input
              inputMode="decimal"
              className={inputClass}
              {...register("squat_kg", { valueAsNumber: true })}
            />
          </Field>
          <SetsFields
            prefix="squat_set"
            register={register}
            values={squatSets}
          />
        </section>
      )}

      {sessionType === "torso_strength" && (
        <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
          <h2 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase">
            Dominadas lastradas · Fuerza
          </h2>
          <RecommendationHint rec={recommendations.pull_up_strength} />
          <Field label="Lastre (kg)" hint="Kilos añadidos">
            <input
              inputMode="decimal"
              className={inputClass}
              {...register("pull_up_kg", { valueAsNumber: true })}
            />
          </Field>
          <SetsFields
            prefix="pull_up_set"
            register={register}
            values={pullUpSets}
          />
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
            <div className="space-y-5 pt-1">
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-700">Dominadas</p>
                <RecommendationHint rec={recommendations.pull_up_hypertrophy} />
                <SetsFields
                  prefix="pull_up_set"
                  register={register}
                  values={pullUpSets}
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-700">
                  Flexiones en anillas
                </p>
                <RecommendationHint rec={recommendations.push_up_hypertrophy} />
                <SetsFields
                  prefix="push_up_set"
                  register={register}
                  values={pushUpSets}
                />
              </div>
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
                <Field label="Flexiones anillas (total)">
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
        <div className="mx-auto flex w-full max-w-5xl flex-col-reverse gap-2 sm:flex-row sm:items-stretch">
          {exists ? (
            <button
              type="button"
              disabled={pending || loadingDate}
              onClick={onDelete}
              className="flex h-14 w-full shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 disabled:opacity-60 sm:w-auto"
            >
              Borrar día
            </button>
          ) : null}
          <button
            type="submit"
            disabled={pending || loadingDate}
            className="flex h-14 w-full items-center justify-center rounded-xl bg-emerald-800 text-sm font-semibold text-white disabled:opacity-60 sm:flex-1"
          >
            {pending ? "Guardando…" : exists ? "Actualizar check-in" : "Guardar check-in"}
          </button>
        </div>
      </div>
    </form>
  );
}
