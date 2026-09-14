import type { listCalendarEvents } from "@/lib/calendar-events";
import { getMonthGrid } from "@/lib/calendar-month";
import { MonthDayCell } from "./month-day-cell";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toDateParam(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function MonthGrid({
  referenceDate,
  events,
}: {
  referenceDate: Date;
  events: Awaited<ReturnType<typeof listCalendarEvents>>;
}) {
  const { monthStart, monthEnd, gridStart, gridEnd } = getMonthGrid(referenceDate);

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

  return (
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
