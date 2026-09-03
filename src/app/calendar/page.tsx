import Link from "next/link";
import { quickAddEventAction } from "@/app/actions/calendar-events";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUserId } from "@/lib/auth";
import { getWeekRange } from "@/lib/calendar-week";
import { listCalendarEvents } from "@/lib/calendar-events";
import { db } from "@/lib/db";
import { TimeGrid } from "./time-grid";

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
  const allDayEvents = events.filter((event) => event.isAllDay);
  const timedEvents = events
    .filter((event) => !event.isAllDay && event.startAt)
    .map((event) => ({
      id: event.id,
      title: event.title,
      startAt: event.startAt!,
      endAt: event.endAt,
    }));

  const prevWeekStart = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
  const nextWeekStart = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
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

      {allDayEvents.length > 0 && (
        <div className="rounded border p-2">
          <h2 className="text-xs font-medium text-zinc-500">All day</h2>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {allDayEvents.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/calendar/${event.id}/edit`}
                  className="rounded bg-zinc-100 px-2 py-0.5 text-xs hover:bg-zinc-200"
                >
                  {event.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto rounded border p-2">
        <TimeGrid weekStart={start} events={timedEvents} />
      </div>
    </div>
  );
}
