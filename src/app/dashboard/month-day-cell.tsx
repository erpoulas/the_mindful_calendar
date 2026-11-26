"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { listCalendarEvents } from "@/lib/calendar-events";
import { fitEventCount } from "@/lib/calendar-month";
import { eventColor } from "@/lib/intention-colors";
import { eventColorStyle, toDayKey } from "./time-grid";
import { useWallClockNow } from "./use-wall-clock-now";

/** A saved event or a journal's scheduled time, with where clicking it leads. */
export type MonthEvent = Pick<
  Awaited<ReturnType<typeof listCalendarEvents>>[number],
  "id" | "title" | "startAt" | "intentions"
> & { href: string };

// Every line under the day number (an event, or "+N more") is h-5 with a
// gap-1 above it, in rem so the sums follow the browser's text size.
const LINE_HEIGHT_REM = 1.25;
const GAP_REM = 0.25;
// Shown before the day has measured its own height (the first paint of a
// full page load).
const EVENTS_BEFORE_MEASURING = 2;

/**
 * How many of a day's events fit below its number without cutting any off.
 * Re-measured whenever the day's box changes size (window resized, rows
 * added), since the month grid stretches its rows to fill the screen.
 */
function useEventsThatFit(eventCount: number) {
  const cellRef = useRef<HTMLDivElement | null>(null);
  const dayNumberRef = useRef<HTMLAnchorElement | null>(null);
  const [fitCount, setFitCount] = useState<number | null>(null);

  useLayoutEffect(() => {
    const cell = cellRef.current;
    const dayNumber = dayNumberRef.current;
    if (!cell || !dayNumber) return;

    function measure() {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const contentBottom =
        cell!.getBoundingClientRect().top +
        cell!.clientTop +
        cell!.clientHeight -
        parseFloat(getComputedStyle(cell!).paddingBottom);
      setFitCount(
        fitEventCount({
          availableHeight: contentBottom - dayNumber!.getBoundingClientRect().bottom,
          lineHeight: LINE_HEIGHT_REM * rem,
          gap: GAP_REM * rem,
          eventCount,
        }),
      );
    }

    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(cell);
    return () => observer.disconnect();
  }, [eventCount]);

  return {
    cellRef,
    dayNumberRef,
    shownCount: fitCount ?? Math.min(eventCount, EVENTS_BEFORE_MEASURING),
  };
}

export function MonthDayCell({
  dayKey,
  dayNumber,
  inMonth,
  weekStartHref,
  events,
}: {
  dayKey: string;
  dayNumber: number;
  inMonth: boolean;
  weekStartHref: string;
  events: MonthEvent[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dayKey });
  const { cellRef, dayNumberRef, shownCount } = useEventsThatFit(events.length);
  const overflow = events.length - shownCount;
  const now = useWallClockNow();
  const isToday = now !== null && toDayKey(now) === dayKey;

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        cellRef.current = node;
      }}
      className={`flex h-full flex-col gap-1 overflow-hidden border-r border-b border-border p-1.5 ${
        inMonth ? "" : "bg-secondary text-muted-foreground"
      } ${isOver ? "bg-accent/30" : ""}`}
    >
      <Link
        ref={dayNumberRef}
        href={weekStartHref}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs leading-none hover:underline ${
          isToday ? "bg-primary text-primary-foreground hover:no-underline" : ""
        }`}
      >
        {dayNumber}
      </Link>
      {events.slice(0, shownCount).map((event) => {
        const color = eventColor(event.intentions);
        return (
          <Link
            key={event.id}
            href={event.href}
            style={eventColorStyle(color)}
            // A fixed one-line height that never shrinks: a busy day shows
            // fewer events instead of squashing them into slivers.
            className={`block h-5 shrink-0 truncate rounded px-1 text-xs leading-5 ${
              color ? "hover:opacity-85" : "bg-accent hover:bg-secondary"
            }`}
          >
            {event.title}
          </Link>
        );
      })}
      {overflow > 0 && (
        <Link
          href={weekStartHref}
          className="h-5 shrink-0 text-xs leading-5 text-muted-foreground hover:underline"
        >
          +{overflow} more
        </Link>
      )}
    </div>
  );
}
