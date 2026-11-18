"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { HourLabelColumn } from "@/lib/hour-labels";
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
  hourLabelColumns,
}: {
  weekStart: Date;
  events: TimeGridEvent[];
  /** One column of hour labels per time zone, main zone last (see buildHourLabelColumns). */
  hourLabelColumns: HourLabelColumn[];
}) {
  const now = useWallClockNow();
  const todayKey = now ? toDayKey(now) : null;
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart.getTime() + i * DAY_MS);
    return { date, key: toDayKey(date) };
  });

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${hourLabelColumns.length}, 3.25rem) repeat(7, minmax(0, 1fr))`,
      }}
    >
      {hourLabelColumns.map((column, index) => (
        <div
          key={index}
          className="sticky -top-px z-30 flex items-end justify-end bg-background px-1 pt-2 pb-1 text-[10px] text-muted-foreground"
        >
          {column.heading}
        </div>
      ))}
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

      {hourLabelColumns.map((column, index) => (
        <div key={index} className="relative" style={{ height: HOUR_HEIGHT * 24 }}>
          {column.labels.map((label, hour) => (
            <div
              key={hour}
              className="absolute right-1 -translate-y-2 text-[10px] whitespace-nowrap text-muted-foreground"
              style={{ top: hour * HOUR_HEIGHT }}
            >
              {hour === 0 ? "" : label}
            </div>
          ))}
        </div>
      ))}

      {days.map(({ key }) => (
        <DayColumn
          key={key}
          dayKey={key}
          now={key === todayKey ? now : null}
          events={events.filter((ev) => toDayKey(ev.startAt) === key)}
        />
      ))}
    </div>
  );
}

function DayColumn({
  dayKey,
  events,
  now,
}: {
  dayKey: string;
  events: TimeGridEvent[];
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
      {events.map((event) => (
        <EventBlock key={event.id} event={event} />
      ))}
    </div>
  );
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
        className="block h-full truncate"
        draggable={false}
      >
        {event.title}
      </Link>
    </div>
  );
}
