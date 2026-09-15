"use client";

import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { togglePanelVisibilityAction } from "@/app/actions/dashboard";
import { useDashboardCustomization } from "./dashboard-shell";

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
  panelKeys,
  children,
}: {
  panelKeys: string[];
  children: React.ReactNode;
}) {
  const { isCustomizing } = useDashboardCustomization();

  return (
    <div
      className="group flex flex-col gap-3"
      data-customizing={isCustomizing ? "true" : "false"}
    >
      <SortableContext items={panelKeys} strategy={verticalListSortingStrategy}>
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
  children,
}: {
  panelKey: string;
  children: React.ReactNode;
}) {
  const { isCustomizing } = useDashboardCustomization();
  const { attributes, listeners, setNodeRef, isDragging, transform, transition } = useSortable({
    id: panelKey,
    data: { type: "panel" },
    disabled: !isCustomizing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isCustomizing ? { ...attributes, ...listeners } : {})}
      className={
        isCustomizing
          ? `touch-none ${isDragging ? "cursor-grabbing opacity-40" : "cursor-grab"}`
          : undefined
      }
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
