"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type CSSProperties } from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { moveCalendarEventAction } from "@/app/actions/calendar-events";

const HOUR_HEIGHT = 48; // px per hour
const SNAP_MINUTES = 15;
const DAY_MS = 24 * 60 * 60 * 1000;

export type TimeGridEvent = {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date | null;
};

function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function minutesSinceMidnightUTC(date: Date) {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

export function TimeGrid({
  weekStart,
  events,
}: {
  weekStart: Date;
  events: TimeGridEvent[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart.getTime() + i * DAY_MS);
    return { date, key: toDayKey(date) };
  });

  function handleDragEnd(e: DragEndEvent) {
    const overDayKey = e.over ? String(e.over.id) : undefined;
    if (!overDayKey) return;

    const dragged = events.find((ev) => ev.id === String(e.active.id));
    if (!dragged) return;

    const snappedDeltaMinutes =
      Math.round(((e.delta.y / HOUR_HEIGHT) * 60) / SNAP_MINUTES) * SNAP_MINUTES;
    const maxStartMinutes = 24 * 60 - SNAP_MINUTES;
    const newMinutes = Math.min(
      Math.max(minutesSinceMidnightUTC(dragged.startAt) + snappedDeltaMinutes, 0),
      maxStartMinutes,
    );

    const overDayStart = new Date(`${overDayKey}T00:00:00Z`);
    const newStartAt = new Date(overDayStart.getTime() + newMinutes * 60 * 1000);

    const durationMs = dragged.endAt
      ? dragged.endAt.getTime() - dragged.startAt.getTime()
      : null;
    const newEndAt = durationMs !== null ? new Date(newStartAt.getTime() + durationMs) : null;

    const unchanged =
      newStartAt.getTime() === dragged.startAt.getTime() &&
      (newEndAt?.getTime() ?? null) === (dragged.endAt?.getTime() ?? null);
    if (unchanged) return;

    startTransition(async () => {
      await moveCalendarEventAction(dragged.id, newStartAt, newEndAt);
      router.refresh();
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className={isPending ? "opacity-60" : ""}>
        <div className="grid grid-cols-[3rem_repeat(7,1fr)]">
          <div />
          {days.map(({ date, key }) => (
            <div
              key={key}
              className="border-b px-1 pb-1 text-center text-xs font-medium text-zinc-600"
            >
              {date.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                timeZone: "UTC",
              })}
            </div>
          ))}

          <div className="relative" style={{ height: HOUR_HEIGHT * 24 }}>
            {Array.from({ length: 24 }, (_, hour) => (
              <div
                key={hour}
                className="absolute right-1 -translate-y-2 text-[10px] text-zinc-400"
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
      </div>
    </DndContext>
  );
}

function DayColumn({ dayKey, events }: { dayKey: string; events: TimeGridEvent[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: dayKey });

  return (
    <div
      ref={setNodeRef}
      className={`relative border-l ${isOver ? "bg-zinc-50" : ""}`}
      style={{ height: HOUR_HEIGHT * 24 }}
    >
      {Array.from({ length: 24 }, (_, hour) => (
        <div
          key={hour}
          className="absolute inset-x-0 border-t border-zinc-100"
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
      className={`absolute inset-x-0.5 touch-none overflow-hidden rounded bg-zinc-800 px-1 text-[11px] leading-tight text-white ${
        isDragging ? "cursor-grabbing opacity-80" : "cursor-grab"
      }`}
    >
      <Link href={`/calendar/${event.id}/edit`} className="block truncate" draggable={false}>
        {event.title}
      </Link>
    </div>
  );
}
