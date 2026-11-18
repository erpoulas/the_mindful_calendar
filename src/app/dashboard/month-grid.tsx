import type { listCalendarEvents } from "@/lib/calendar-events";
import { getMonthGrid } from "@/lib/calendar-month";
import type { GoogleCalendarItem } from "@/lib/google-calendar";
import { MonthDayCell, type MonthCellEvent } from "./month-day-cell";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toDateParam(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function MonthGrid({
  referenceDate,
  events,
  googleEvents = [],
}: {
  referenceDate: Date;
  events: Awaited<ReturnType<typeof listCalendarEvents>>;
  /** Events from Google Calendar, shown read-only alongside our own. */
  googleEvents?: GoogleCalendarItem[];
}) {
  const { monthStart, monthEnd, gridStart, gridEnd } = getMonthGrid(referenceDate);

  // One list holding both kinds, sorted by time, so the "+N more" cut-off
  // treats them alike.
  const cellEvents: MonthCellEvent[] = [
    ...events.flatMap((event) =>
      event.startAt
        ? [
            {
              id: event.id,
              title: event.title,
              startAt: event.startAt,
              href: `/dashboard?panel=calendar-event&view=edit&id=${event.id}`,
              isGoogle: false,
            },
          ]
        : [],
    ),
    ...googleEvents.map((event) => ({
      id: event.id,
      title: event.title,
      startAt: event.startAt,
      href: event.htmlLink ?? "https://calendar.google.com",
      isGoogle: true,
    })),
  ].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  const totalDays = (gridEnd.getTime() - gridStart.getTime()) / MS_PER_DAY;
  const weekRows = totalDays / 7;
  const days = Array.from({ length: totalDays }, (_, i) => {
    const date = new Date(gridStart.getTime() + i * MS_PER_DAY);
    const nextDate = new Date(date.getTime() + MS_PER_DAY);
    const dayEvents = cellEvents.filter(
      (event) => event.startAt >= date && event.startAt < nextDate,
    );
    return {
      date,
      inMonth: date >= monthStart && date < monthEnd,
      events: dayEvents,
    };
  });

  return (
    <div
      className="grid h-full grid-cols-7 overflow-hidden text-xs"
      style={{ gridTemplateRows: `auto repeat(${weekRows}, 1fr)` }}
    >
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
        <div
          key={label}
          className="border-r border-b border-border px-2 py-1 text-center font-medium text-foreground"
        >
          {label}
        </div>
      ))}
      {days.map(({ date, inMonth, events: dayEvents }) => {
        const shown = dayEvents.slice(0, 3);
        const overflow = dayEvents.length - shown.length;
        const weekStartParam = toDateParam(date);

        return (
          <MonthDayCell
            key={date.toISOString()}
            dayKey={weekStartParam}
            dayNumber={date.getUTCDate()}
            inMonth={inMonth}
            weekStartHref={`/dashboard?start=${weekStartParam}`}
            events={shown}
            overflow={overflow}
          />
        );
      })}
    </div>
  );
}
