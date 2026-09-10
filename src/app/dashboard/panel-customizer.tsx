"use client";

import { useState } from "react";
import { togglePanelVisibilityAction } from "@/app/actions/dashboard";

const PANEL_LABELS: Record<string, string> = {
  affirmation: "Today's affirmation",
  season: "Current season",
  breakdown: "Time by intention",
  projects: "Projects",
  quicklist: "Quick list",
  journal: "Journal",
  dopamine: "Dopamine menu",
  review: "Weekly review",
};

export function PanelCustomizer({
  hiddenPanels,
  children,
}: {
  hiddenPanels: string[];
  children: React.ReactNode;
}) {
  const [isCustomizing, setIsCustomizing] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsCustomizing((value) => !value)}
        className="mb-2 text-xs text-zinc-600 underline"
      >
        ⚙ {isCustomizing ? "Done customizing" : "Customize panels"}
      </button>

      <div
        className="group flex flex-col gap-3"
        data-customizing={isCustomizing ? "true" : "false"}
      >
        {children}
      </div>

      {isCustomizing && hiddenPanels.length > 0 && (
        <div className="mt-3 border-t pt-3">
          <p className="mb-1 text-xs font-medium text-zinc-500">Hidden — click to bring back</p>
          <ul className="flex flex-col gap-1">
            {hiddenPanels.map((panelKey) => (
              <li key={panelKey}>
                <form action={togglePanelVisibilityAction.bind(null, panelKey)}>
                  <button type="submit" className="text-xs text-zinc-600 underline">
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
