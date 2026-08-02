import { DailyForm } from "@/components/check-in/daily-form";
import { getCheckInDefaults } from "@/lib/data/check-in";
import { todayInMadrid } from "@/lib/dates";

export default async function CheckInPage() {
  const defaults = await getCheckInDefaults(todayInMadrid());

  return (
    <main>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Check-in
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Volcado diario en menos de un minuto.
        </p>
      </div>
      <DailyForm defaults={defaults} />
    </main>
  );
}
