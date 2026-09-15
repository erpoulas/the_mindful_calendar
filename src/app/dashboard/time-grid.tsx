"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

export const HOUR_HEIGHT = 48; // px per hour
export const SNAP_MINUTES = 15;
const DAY_MS = 24 * 60 * 60 * 1000;

export type TimeGridEvent = {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date | null;
};

export function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function minutesSinceMidnightUTC(date: Date) {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

export function TimeGrid({
  weekStart,
  events,
}: {
  weekStart: Date;
  events: TimeGridEvent[];
}) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart.getTime() + i * DAY_MS);
    return { date, key: toDayKey(date) };
  });

  return (
    <div className="grid grid-cols-[3rem_repeat(7,1fr)]">
      <div />
      {days.map(({ date, key }) => (
        <div
          key={key}
          className="border-b px-1 pb-1 text-center text-xs font-medium text-foreground"
        >
          {date.toLocaleDateString(undefined, {
            weekday: "short",
            timeZone: "UTC",
          })}
          , {date.getUTCMonth() + 1}/{date.getUTCDate()}
        </div>
      ))}

      <div className="relative" style={{ height: HOUR_HEIGHT * 24 }}>
        {Array.from({ length: 24 }, (_, hour) => (
          <div
            key={hour}
            className="absolute right-1 -translate-y-2 text-[10px] text-muted-foreground"
            style={{ top: hour * HOUR_HEIGHT }}
          >
            {hour === 0 ? "" : `${hour}:00`}
          </div>
        ))}
      </div>

      {days.map(({ key }) => (
        <DayColumn
          key={key}
          dayKey={key}
          events={events.filter((ev) => toDayKey(ev.startAt) === key)}
        />
      ))}
    </div>
  );
}

function DayColumn({ dayKey, events }: { dayKey: string; events: TimeGridEvent[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: dayKey });

  return (
    <div
      ref={setNodeRef}
      className={`relative border-l ${isOver ? "bg-accent" : ""}`}
      style={{ height: HOUR_HEIGHT * 24 }}
    >
      {Array.from({ length: 24 }, (_, hour) => (
        <div
          key={hour}
          className="absolute inset-x-0 border-t border-border/40"
          style={{ top: hour * HOUR_HEIGHT }}
        />
      ))}
      {events.map((event) => (
        <EventBlock key={event.id} event={event} />
      ))}
    </div>
  );
}

function EventBlock({ event }: { event: TimeGridEvent }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: { type: "event" },
  });

  const top = (minutesSinceMidnightUTC(event.startAt) / 60) * HOUR_HEIGHT;
  const durationMinutes = event.endAt
    ? (event.endAt.getTime() - event.startAt.getTime()) / (60 * 1000)
    : 30;
  const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 18);

  const style: CSSProperties = {
    top,
    height,
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`absolute inset-x-0.5 touch-none overflow-hidden rounded bg-primary px-1 text-[11px] leading-tight text-primary-foreground ${
        isDragging ? "cursor-grabbing opacity-80" : "cursor-grab"
      }`}
    >
      <Link
        href={`/dashboard?panel=calendar-event&view=edit&id=${event.id}`}
        className="block truncate"
        draggable={false}
      >
        {event.title}
      </Link>
    </div>
  );
}
