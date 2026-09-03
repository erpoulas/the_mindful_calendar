import Link from "next/link";
import { quickAddEventAction } from "@/app/actions/calendar-events";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUserId } from "@/lib/auth";
import { getWeekRange } from "@/lib/calendar-week";
import { listCalendarEvents } from "@/lib/calendar-events";
import { db } from "@/lib/db";

const DAY_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
};

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
};

function toDateParam(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function CalendarPage({
  searchParams,
}: PageProps<"/calendar">) {
  const { start: startParam } = await searchParams;
  const userId = await getCurrentUserId();

  const referenceDate =
    typeof startParam === "string" ? new Date(startParam) : new Date();
  const { start, end } = getWeekRange(referenceDate);

  const events = await listCalendarEvents(db, { userId, start, end });

  const days = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const dayEvents = events.filter(
      (event) =>
        event.startAt && event.startAt >= dayStart && event.startAt < dayEnd,
    );
    return { date: dayStart, events: dayEvents };
  });

  const prevWeekStart = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
  const nextWeekStart = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <Link href="/dashboard" className="text-sm text-zinc-600 underline">
        ← Dashboard
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <div className="flex gap-2">
          <Link href="/calendar/month" className={buttonVariants({ variant: "outline" })}>
            Month view
          </Link>
          <Link href="/calendar/new" className={buttonVariants()}>
            New event
          </Link>
        </div>
      </div>

      <form action={quickAddEventAction} className="flex gap-2">
        <Input name="title" placeholder="Quick add: type a title and press Enter" required />
        <Button type="submit">Add</Button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <Link href={`/calendar?start=${toDateParam(prevWeekStart)}`} className="underline">
          ← Previous week
        </Link>
        <Link href={`/calendar?start=${toDateParam(nextWeekStart)}`} className="underline">
          Next week →
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {days.map(({ date, events: dayEvents }) => (
          <div key={date.toISOString()} className="rounded border p-3">
            <h2 className="text-sm font-medium text-zinc-600">
              {date.toLocaleDateString(undefined, DAY_FORMAT)}
            </h2>
            {dayEvents.length === 0 ? (
              <p className="mt-1 text-sm text-zinc-400">No events</p>
            ) : (
              <ul className="mt-1 flex flex-col gap-1">
                {dayEvents.map((event) => (
                  <li key={event.id}>
                    <Link
                      href={`/calendar/${event.id}/edit`}
                      className="flex items-center gap-2 text-sm hover:underline"
                    >
                      <span className="text-zinc-500">
                        {event.isAllDay
                          ? "All day"
                          : event.startAt?.toLocaleTimeString(undefined, TIME_FORMAT)}
                      </span>
                      <span>{event.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
