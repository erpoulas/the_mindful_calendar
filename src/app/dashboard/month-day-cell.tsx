"use client";

import Link from "next/link";
import { useDroppable } from "@dnd-kit/core";
import { GoogleBadge } from "./google-badge";
import { toDayKey } from "./time-grid";
import { useWallClockNow } from "./use-wall-clock-now";

/** One of our own events (opens the edit popup) or a read-only Google one (opens Google). */
export type MonthCellEvent = {
  id: string;
  title: string;
  startAt: Date;
  href: string;
  isGoogle: boolean;
};

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
  events: MonthCellEvent[];
  overflow: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dayKey });
  const now = useWallClockNow();
  const isToday = now !== null && toDayKey(now) === dayKey;

  return (
    <div
      ref={setNodeRef}
      className={`flex h-full flex-col gap-1 overflow-hidden border-r border-b border-border p-1.5 ${
        inMonth ? "" : "bg-secondary text-muted-foreground"
      } ${isOver ? "bg-accent/30" : ""}`}
    >
      <Link
        href={weekStartHref}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs leading-none hover:underline ${
          isToday ? "bg-primary text-primary-foreground hover:no-underline" : ""
        }`}
      >
        {dayNumber}
      </Link>
      {events.map((event) =>
        event.isGoogle ? (
          <a
            key={event.id}
            href={event.href}
            target="_blank"
            rel="noreferrer"
            title={`${event.title} (from Google Calendar)`}
            className="flex items-center gap-1 rounded border border-primary/40 px-1 text-xs hover:bg-secondary"
          >
            <GoogleBadge />
            <span className="truncate">{event.title}</span>
          </a>
        ) : (
          <Link
            key={event.id}
            href={event.href}
            className="truncate rounded bg-accent px-1 text-xs hover:bg-secondary"
          >
            {event.title}
          </Link>
        ),
      )}
      {overflow > 0 && (
        <Link href={weekStartHref} className="text-xs text-muted-foreground hover:underline">
          +{overflow} more
        </Link>
      )}
    </div>
  );
}
