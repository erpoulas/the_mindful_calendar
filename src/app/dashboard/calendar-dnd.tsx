"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { moveCalendarEventAction } from "@/app/actions/calendar-events";
import {
  HOUR_HEIGHT,
  SNAP_MINUTES,
  minutesSinceMidnightUTC,
  type TimeGridEvent,
} from "./time-grid";

export function CalendarDndProvider({
  events,
  children,
}: {
  events: TimeGridEvent[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragEnd(e: DragEndEvent) {
    const overDayKey = e.over ? String(e.over.id) : undefined;
    if (!overDayKey) return;

    if (e.active.data.current?.type === "postit") {
      const text = String(e.active.data.current?.text ?? "");
      const params = new URLSearchParams({
        panel: "calendar-event",
        view: "new",
        date: overDayKey,
        title: text,
        postItId: String(e.active.id),
      });
      router.push(`/dashboard?${params.toString()}`);
      return;
    }

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
      <div className={`flex flex-col gap-4 ${isPending ? "opacity-60" : ""}`}>{children}</div>
    </DndContext>
  );
}
