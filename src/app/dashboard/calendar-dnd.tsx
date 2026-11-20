"use client";

import { useRouter } from "next/navigation";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import {
  closestCenter,
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
import { reorderPanelsAction } from "@/app/actions/dashboard";
import { reorderPostItsAction } from "@/app/actions/post-its";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { noDroppedPositions, type DroppedPositions } from "@/lib/dropped-positions";
import { DroppedPositionsContext } from "./dropped-positions-context";
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
  panelKeys,
  hiddenPanels,
  children,
}: {
  events: TimeGridEvent[];
  postItIds: string[];
  panelKeys: string[];
  hiddenPanels: string[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Set inside the same transition as the save, so React drops it the
  // moment the action's response brings the saved page.
  const [droppedPositions, showDropped] = useOptimistic(
    noDroppedPositions,
    (current, change: Partial<DroppedPositions>) => ({
      ...current,
      ...change,
      eventMoves: { ...current.eventMoves, ...change.eventMoves },
    }),
  );
  const [draggedPostItText, setDraggedPostItText] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Letting go after a drag still fires a click on the dragged item. dnd-kit
  // stops that click from reaching React, but doesn't cancel it, so on a
  // link (like a whole event box) the browser would still follow it and
  // load the edit form. This blocks the browser's part for that one click.
  const justDragged = useRef(false);
  useEffect(() => {
    function cancelClickAfterDrag(event: MouseEvent) {
      if (justDragged.current) event.preventDefault();
    }
    window.addEventListener("click", cancelClickAfterDrag, { capture: true });
    return () => window.removeEventListener("click", cancelClickAfterDrag, { capture: true });
  }, []);

  function clearJustDraggedAfterClick() {
    // The click comes straight after the pointer is released, before this
    // timer runs, so the flag only ever covers that one click.
    setTimeout(() => {
      justDragged.current = false;
    }, 0);
  }

  function handleDragStart(e: DragStartEvent) {
    justDragged.current = true;
    if (e.active.data.current?.type === "postit") {
      setDraggedPostItText(String(e.active.data.current?.text ?? ""));
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    clearJustDraggedAfterClick();
    setDraggedPostItText(null);
    const overId = e.over ? String(e.over.id) : undefined;
    if (!overId) return;

    const isPostIt = e.active.data.current?.type === "postit";
    const overIsPostIt = e.over?.data.current?.type === "postit";
    const isPanel = e.active.data.current?.type === "panel";
    const overIsPanel = e.over?.data.current?.type === "panel";

    if (isPanel && overIsPanel) {
      const activeId = String(e.active.id);
      if (activeId === overId) return;

      const oldIndex = panelKeys.indexOf(activeId);
      const newIndex = panelKeys.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const reorderedVisible = arrayMove(panelKeys, oldIndex, newIndex);
      const fullOrder = [...reorderedVisible, ...hiddenPanels];
      // The action's response already carries the updated page (it calls
      // revalidatePath), so no router.refresh() is needed afterwards.
      startTransition(async () => {
        showDropped({ panelOrder: reorderedVisible });
        await reorderPanelsAction(fullOrder);
      });
      return;
    }

    if (isPostIt && overIsPostIt) {
      const activeId = String(e.active.id);
      if (activeId === overId) return;

      const oldIndex = postItIds.indexOf(activeId);
      const newIndex = postItIds.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(postItIds, oldIndex, newIndex);
      startTransition(async () => {
        showDropped({ postItOrder: reordered });
        await reorderPostItsAction(reordered);
      });
      return;
    }

    if (isPostIt) {
      const text = String(e.active.data.current?.text ?? "");
      router.push(dashboardRoutes.newEvent({ date: overId, title: text, postItId: String(e.active.id) }));
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
      showDropped({ eventMoves: { [dragged.id]: { startAt: newStartAt, endAt: newEndAt } } });
      await moveCalendarEventAction(dragged.id, newStartAt, newEndAt);
    });
  }

  return (
    <DroppedPositionsContext.Provider value={droppedPositions}>
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        clearJustDraggedAfterClick();
        setDraggedPostItText(null);
      }}
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
    </DroppedPositionsContext.Provider>
  );
}
