"use client";

import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { togglePanelVisibilityAction } from "@/app/actions/dashboard";
import { useDashboardCustomization } from "./dashboard-shell";
import { useDroppedPositions } from "./dropped-positions-context";

const PANEL_LABELS: Record<string, string> = {
  affirmation: "Today's affirmation",
  breakdown: "Time by intention",
  projects: "Projects",
  quicklist: "Quick list",
  journal: "Journal",
  dopamine: "Dopamine menu",
  review: "Weekly review",
};

export function PanelList({
  panelKeys: savedPanelKeys,
  children,
}: {
  panelKeys: string[];
  children: React.ReactNode;
}) {
  const { isCustomizing } = useDashboardCustomization();
  const droppedOrder = useDroppedPositions().panelOrder;
  const panelKeys = droppedOrder ?? savedPanelKeys;

  return (
    <div
      className="group flex flex-wrap gap-3"
      data-customizing={isCustomizing ? "true" : "false"}
    >
      {/* The list wraps so desktop icons sit two to a row; rectSortingStrategy
          lets drag-to-reorder move panels across rows, not just up and down. */}
      <SortableContext items={panelKeys} strategy={rectSortingStrategy}>
        {children}
      </SortableContext>
    </div>
  );
}

// Wraps one panel so it can be dragged to a new position. Dragging is only
// enabled while customizing, so the panel's own links/buttons behave
// normally the rest of the time.
export function SortablePanel({
  panelKey,
  isDesktopIcon = false,
  children,
}: {
  panelKey: string;
  isDesktopIcon?: boolean;
  children: React.ReactNode;
}) {
  const { isCustomizing } = useDashboardCustomization();
  // The panels arrive from the server in their saved order. A panel just
  // dragged elsewhere is moved with CSS order (the list is a flex column)
  // until the new order is saved and the server sends the panels again.
  const droppedOrder = useDroppedPositions().panelOrder;
  const droppedIndex = droppedOrder ? droppedOrder.indexOf(panelKey) : -1;
  const { attributes, listeners, setNodeRef, isDragging, transform, transition } = useSortable({
    id: panelKey,
    data: { type: "panel" },
    disabled: !isCustomizing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    order: droppedIndex === -1 ? undefined : droppedIndex,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isCustomizing ? { ...attributes, ...listeners } : {})}
      className={[
        // Half the sidebar minus half the gap-3, so two icons fit per row.
        isDesktopIcon ? "w-[calc(50%-0.375rem)]" : "w-full",
        isCustomizing
          ? `touch-none ${isDragging ? "cursor-grabbing opacity-40" : "cursor-grab"}`
          : "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function PanelCustomizerControls({ hiddenPanels }: { hiddenPanels: string[] }) {
  const { isCustomizing, toggleCustomizing, sidebarHidden, hideSidebar, showSidebar } =
    useDashboardCustomization();

  if (sidebarHidden) {
    return (
      <button
        type="button"
        onClick={showSidebar}
        className="text-xs text-muted-foreground underline"
      >
        Show side panels
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggleCustomizing}
        className="text-xs text-muted-foreground underline"
      >
        ⚙ {isCustomizing ? "Done customizing" : "Customize panels"}
      </button>

      {isCustomizing && (
        <button
          type="button"
          onClick={hideSidebar}
          className="mt-2 block text-xs text-muted-foreground underline"
        >
          Hide side panels
        </button>
      )}

      {isCustomizing && hiddenPanels.length > 0 && (
        <div className="mt-3 border-t pt-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Hidden — click to bring back</p>
          <ul className="flex flex-col gap-1">
            {hiddenPanels.map((panelKey) => (
              <li key={panelKey}>
                <form action={togglePanelVisibilityAction.bind(null, panelKey)}>
                  <button type="submit" className="text-xs text-muted-foreground underline">
                    + {PANEL_LABELS[panelKey] ?? panelKey}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
