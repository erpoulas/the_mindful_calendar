"use client";

import Link from "next/link";
import { useDroppable } from "@dnd-kit/core";
import type { listCalendarEvents } from "@/lib/calendar-events";

type MonthEvent = Awaited<ReturnType<typeof listCalendarEvents>>[number];

export function MonthDayCell({
  dayKey,
  dayNumber,
  inMonth,
  weekStartHref,
  events,
  overflow,
}: {
  dayKey: string;
  dayNumber: number;
  inMonth: boolean;
  weekStartHref: string;
  events: MonthEvent[];
  overflow: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dayKey });

  return (
    <div
      ref={setNodeRef}
      className={`flex h-full flex-col gap-1 overflow-hidden border-r border-b border-border p-1.5 ${
        inMonth ? "" : "bg-secondary text-muted-foreground"
      } ${isOver ? "bg-accent" : ""}`}
    >
      <Link href={weekStartHref} className="text-xs hover:underline">
        {dayNumber}
      </Link>
      {events.map((event) => (
        <Link
          key={event.id}
          href={`/dashboard?panel=calendar-event&view=edit&id=${event.id}`}
          className="truncate rounded bg-accent px-1 text-xs hover:bg-secondary"
        >
          {event.title}
        </Link>
      ))}
      {overflow > 0 && (
        <Link href={weekStartHref} className="text-xs text-muted-foreground hover:underline">
          +{overflow} more
        </Link>
      )}
    </div>
  );
}
