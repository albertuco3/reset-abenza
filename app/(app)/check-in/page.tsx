import { DailyForm } from "@/components/check-in/daily-form";
import { MindsetWrapper } from "@/components/motivation/mindset-wrapper";
import { getCheckInLoad } from "@/lib/data/check-in";
import { todayInMadrid } from "@/lib/dates";

type Props = {
  searchParams: Promise<{ date?: string }>;
};

export default async function CheckInPage({ searchParams }: Props) {
  const params = await searchParams;
  const raw = params.date;
  const entryDate =
    raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : todayInMadrid();
  const { values, exists, recommendations } = await getCheckInLoad(entryDate);

  return (
    <main>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Check-in
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {exists
              ? "Editando un día ya registrado."
              : "Volcado diario en menos de un minuto."}
          </p>
        </div>
        <MindsetWrapper label="Manifiesto & Mindset 🔥" />
      </div>
      <DailyForm
        defaults={values}
        initiallyExists={exists}
        recommendations={recommendations}
      />
    </main>
  );
}
