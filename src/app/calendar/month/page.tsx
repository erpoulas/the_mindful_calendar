import Link from "next/link";
import { getCurrentUserId } from "@/lib/auth";
import { getMonthGrid } from "@/lib/calendar-month";
import { listCalendarEvents } from "@/lib/calendar-events";
import { db } from "@/lib/db";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const MONTH_FORMAT: Intl.DateTimeFormatOptions = {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
};

function toDateParam(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function CalendarMonthPage({
  searchParams,
}: PageProps<"/calendar/month">) {
  const { start: startParam } = await searchParams;
  const userId = await getCurrentUserId();

  const referenceDate =
    typeof startParam === "string" ? new Date(startParam) : new Date();
  const { monthStart, monthEnd, gridStart, gridEnd } = getMonthGrid(referenceDate);

  const events = await listCalendarEvents(db, { userId, start: gridStart, end: gridEnd });

  const totalDays = (gridEnd.getTime() - gridStart.getTime()) / MS_PER_DAY;
  const days = Array.from({ length: totalDays }, (_, i) => {
    const date = new Date(gridStart.getTime() + i * MS_PER_DAY);
    const nextDate = new Date(date.getTime() + MS_PER_DAY);
    const dayEvents = events.filter(
      (event) => event.startAt && event.startAt >= date && event.startAt < nextDate,
    );
    return {
      date,
      inMonth: date >= monthStart && date < monthEnd,
      events: dayEvents,
    };
  });

  const prevMonthRef = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() - 1, 1),
  );
  const nextMonthRef = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1),
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <Link href="/calendar" className="text-sm text-zinc-600 underline">
        ← Week view
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {monthStart.toLocaleDateString(undefined, MONTH_FORMAT)}
        </h1>
        <div className="flex gap-4 text-sm">
          <Link href={`/calendar/month?start=${toDateParam(prevMonthRef)}`} className="underline">
            ← Previous
          </Link>
          <Link href={`/calendar/month?start=${toDateParam(nextMonthRef)}`} className="underline">
            Next →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded border bg-zinc-200 text-xs">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
          <div key={label} className="bg-zinc-50 px-2 py-1 text-center font-medium text-zinc-600">
            {label}
          </div>
        ))}
        {days.map(({ date, inMonth, events: dayEvents }) => {
          const shown = dayEvents.slice(0, 3);
          const overflow = dayEvents.length - shown.length;
          const weekStartParam = toDateParam(date);

          return (
            <div
              key={date.toISOString()}
              className={`flex min-h-24 flex-col gap-1 bg-white p-1.5 ${
                inMonth ? "" : "bg-zinc-50 text-zinc-400"
              }`}
            >
              <Link href={`/calendar?start=${weekStartParam}`} className="text-xs hover:underline">
                {date.getUTCDate()}
              </Link>
              {shown.map((event) => (
                <Link
                  key={event.id}
                  href={`/calendar/${event.id}/edit`}
                  className="truncate rounded bg-zinc-100 px-1 text-xs hover:bg-zinc-200"
                >
                  {event.title}
                </Link>
              ))}
              {overflow > 0 && (
                <Link
                  href={`/calendar?start=${weekStartParam}`}
                  className="text-xs text-zinc-500 hover:underline"
                >
                  +{overflow} more
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
