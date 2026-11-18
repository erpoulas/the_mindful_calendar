"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { GoogleCalendarItem } from "@/lib/google-calendar";
import { GoogleBadge } from "./google-badge";
import { useWallClockNow } from "./use-wall-clock-now";

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
  googleEvents = [],
}: {
  weekStart: Date;
  events: TimeGridEvent[];
  /** Timed events from Google Calendar, shown read-only. */
  googleEvents?: GoogleCalendarItem[];
}) {
  const now = useWallClockNow();
  const todayKey = now ? toDayKey(now) : null;
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart.getTime() + i * DAY_MS);
    return { date, key: toDayKey(date) };
  });

  return (
    <div className="grid grid-cols-[3rem_repeat(7,1fr)]">
      <div className="sticky -top-px z-30 bg-background pt-2" />
      {days.map(({ date, key }) => (
        <div
          key={key}
          className="sticky -top-px z-30 flex flex-col items-center border-b bg-background px-1 pt-2 pb-1 text-center text-xs font-medium text-foreground"
        >
          <span>
            {date.toLocaleDateString(undefined, {
              weekday: "short",
              timeZone: "UTC",
            })}
          </span>
          <span>
            {date.getUTCMonth() + 1}/{date.getUTCDate()}
          </span>
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
          now={key === todayKey ? now : null}
          events={events.filter((ev) => toDayKey(ev.startAt) === key)}
          googleEvents={googleEvents.filter((ev) => toDayKey(ev.startAt) === key)}
        />
      ))}
    </div>
  );
}

function DayColumn({
  dayKey,
  events,
  googleEvents,
  now,
}: {
  dayKey: string;
  events: TimeGridEvent[];
  googleEvents: GoogleCalendarItem[];
  /** Wall-clock "now" when this column is today, otherwise null. */
  now: Date | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dayKey });

  return (
    <div
      ref={setNodeRef}
      className={`relative border-l ${isOver ? "bg-accent/30" : ""}`}
      style={{ height: HOUR_HEIGHT * 24 }}
    >
      {Array.from({ length: 24 }, (_, hour) => (
        <div
          key={hour}
          className="absolute inset-x-0 border-t border-border/40"
          style={{ top: hour * HOUR_HEIGHT }}
        />
      ))}
      {now && <NowIndicator now={now} />}
      {googleEvents.map((event) => (
        <GoogleEventBlock key={event.id} event={event} />
      ))}
      {events.map((event) => (
        <EventBlock key={event.id} event={event} />
      ))}
    </div>
  );
}

/** Where an event sits in its day column, in px. Events with no end get 30 minutes. */
function blockPosition(startAt: Date, endAt: Date | null) {
  const top = (minutesSinceMidnightUTC(startAt) / 60) * HOUR_HEIGHT;
  const durationMinutes = endAt ? (endAt.getTime() - startAt.getTime()) / (60 * 1000) : 30;
  const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 18);
  return { top, height };
}

// Draws the current-time line on today's column and, once on mount, scrolls
// the calendar's own scroll box so the week view opens centred on "now".
// It sets scrollTop on that one box rather than calling scrollIntoView,
// because scrollIntoView also scrolls every ancestor — including the
// overflow-hidden page wrappers — which shoved the whole dashboard out of
// place with no scrollbar to undo it.
function NowIndicator({ now }: { now: Date }) {
  const lineRef = useRef<HTMLDivElement>(null);
  const top = (minutesSinceMidnightUTC(now) / 60) * HOUR_HEIGHT;

  useEffect(() => {
    const line = lineRef.current;
    const scrollBox = line?.closest("[data-calendar-scroll]");
    if (!line || !scrollBox) return;
    const lineOffset = line.getBoundingClientRect().top - scrollBox.getBoundingClientRect().top;
    scrollBox.scrollTop += lineOffset - scrollBox.clientHeight / 2;
  }, []);

  return (
    <div ref={lineRef} className="pointer-events-none absolute inset-x-0 z-20" style={{ top }}>
      <div className="absolute top-1/2 left-0 h-2 w-2 -translate-x-1 -translate-y-1/2 rounded-full bg-red-500" />
      <div className="h-0.5 bg-red-500" />
    </div>
  );
}

function EventBlock({ event }: { event: TimeGridEvent }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: { type: "event" },
  });

  const style: CSSProperties = {
    ...blockPosition(event.startAt, event.endAt),
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

// Read-only: not draggable, and clicking opens the event in Google Calendar.
function GoogleEventBlock({ event }: { event: GoogleCalendarItem }) {
  return (
    <a
      href={event.htmlLink ?? "https://calendar.google.com"}
      target="_blank"
      rel="noreferrer"
      title={`${event.title} (from Google Calendar)`}
      style={blockPosition(event.startAt, event.endAt)}
      className="absolute inset-x-0.5 flex items-start gap-1 overflow-hidden rounded border border-primary/60 bg-background/90 px-1 text-[11px] leading-tight text-foreground hover:bg-accent"
    >
      <GoogleBadge />
      <span className="truncate">{event.title}</span>
    </a>
  );
}
