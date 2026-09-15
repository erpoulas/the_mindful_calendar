"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { moveCalendarEventAction } from "@/app/actions/calendar-events";
import { reorderPostItsAction } from "@/app/actions/post-its";
import { PostItVisual } from "./post-it-column";
import {
  HOUR_HEIGHT,
  SNAP_MINUTES,
  minutesSinceMidnightUTC,
  type TimeGridEvent,
} from "./time-grid";

export function CalendarDndProvider({
  events,
  postItIds,
  children,
}: {
  events: TimeGridEvent[];
  postItIds: string[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draggedPostItText, setDraggedPostItText] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragStart(e: DragStartEvent) {
    if (e.active.data.current?.type === "postit") {
      setDraggedPostItText(String(e.active.data.current?.text ?? ""));
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    setDraggedPostItText(null);
    const overId = e.over ? String(e.over.id) : undefined;
    if (!overId) return;

    const isPostIt = e.active.data.current?.type === "postit";
    const overIsPostIt = e.over?.data.current?.type === "postit";

    if (isPostIt && overIsPostIt) {
      const activeId = String(e.active.id);
      if (activeId === overId) return;

      const oldIndex = postItIds.indexOf(activeId);
      const newIndex = postItIds.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(postItIds, oldIndex, newIndex);
      startTransition(async () => {
        await reorderPostItsAction(reordered);
        router.refresh();
      });
      return;
    }

    if (isPostIt) {
      const text = String(e.active.data.current?.text ?? "");
      const params = new URLSearchParams({
        panel: "calendar-event",
        view: "new",
        date: overId,
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

    const overDayStart = new Date(`${overId}T00:00:00Z`);
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
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggedPostItText(null)}
    >
      <div className={`flex min-h-0 flex-1 flex-col ${isPending ? "opacity-60" : ""}`}>
        {children}
      </div>
      <DragOverlay>
        {draggedPostItText !== null && (
          <div className="relative w-28 -rotate-1">
            <PostItVisual text={draggedPostItText} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
