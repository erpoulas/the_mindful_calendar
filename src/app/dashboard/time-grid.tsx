"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { HourLabelColumn } from "@/lib/hour-labels";
import { applyEventMoves } from "@/lib/dropped-positions";
import type { IntentionColor } from "@/lib/intention-colors";
import { useDroppedPositions } from "./dropped-positions-context";
import { useWallClockNow } from "./use-wall-clock-now";

export const HOUR_HEIGHT = 48; // px per hour
export const SNAP_MINUTES = 15;
const DAY_MS = 24 * 60 * 60 * 1000;

export type TimeGridEvent = {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date | null;
  /** From the event's intention; null keeps the plain look. */
  color: IntentionColor | null;
  /** Where clicking it leads (see calendarEventHref). */
  href: string;
  /**
   * False for a journal's scheduled writing time: it comes from the
   * journal's schedule, so it can't be dragged, and it looks lighter (a plan).
   */
  movable?: boolean;
};

/** Inline colors for an event drawn in its intention's color. */
export function eventColorStyle(color: IntentionColor | null): CSSProperties | undefined {
  return color ? { backgroundColor: color.hex, color: color.textHex } : undefined;
}

export function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function minutesSinceMidnightUTC(date: Date) {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

// An all-day event's endAt is its last day (or null for a one-day event), so
// it covers every day from its start day through that last day.
function coversDay(event: TimeGridEvent, dayKey: string) {
  const firstDayKey = toDayKey(event.startAt);
  const lastDayKey = toDayKey(event.endAt ?? event.startAt);
  return firstDayKey <= dayKey && dayKey <= lastDayKey;
}

export function TimeGrid({
  weekStart,
  events: savedEvents,
  allDayEvents,
  hourLabelColumns,
}: {
  weekStart: Date;
  events: TimeGridEvent[];
  /** Shown under the day header of each day they cover. */
  allDayEvents: TimeGridEvent[];
  /** One column of hour labels per time zone, main zone last (see buildHourLabelColumns). */
  hourLabelColumns: HourLabelColumn[];
}) {
  const now = useWallClockNow();
  // An event just dragged shows at its new time while the move is saved.
  const events = applyEventMoves(savedEvents, useDroppedPositions().eventMoves);
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
          <AllDayList events={allDayEvents.filter((event) => coversDay(event, key))} />
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

function AllDayList({ events }: { events: TimeGridEvent[] }) {
  if (events.length === 0) return null;

  return (
    <ul className="mt-1 flex w-full flex-col gap-0.5 text-left font-normal">
      {events.map((event) => (
        <li key={event.id}>
          <Link
            href={event.href}
            title={event.title}
            style={eventColorStyle(event.color)}
            className={`block truncate rounded px-1 text-[11px] ${
              event.color ? "hover:opacity-85" : "bg-accent hover:bg-secondary"
            }`}
          >
            {event.title}
          </Link>
        </li>
      ))}
    </ul>
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
  const movable = event.movable !== false;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: { type: "event" },
    disabled: !movable,
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
    ...eventColorStyle(event.color),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`absolute inset-x-0.5 touch-none overflow-hidden rounded px-1 text-[11px] leading-tight ${
        !movable
          ? "border border-dashed border-primary/40 bg-background/80 text-foreground"
          : event.color
            ? ""
            : "bg-primary text-primary-foreground"
      } ${
        !movable ? "cursor-pointer" : isDragging ? "cursor-grabbing opacity-80" : "cursor-grab"
      }`}
    >
      <Link
        href={event.href}
        className="block h-full truncate"
        draggable={false}
      >
        {event.title}
      </Link>
    </div>
  );
}
