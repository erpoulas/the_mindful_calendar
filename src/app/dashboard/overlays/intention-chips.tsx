"use client";

import { useOptimistic, useTransition } from "react";
import { saveInBackground } from "./use-optimistic-list";

export type IntentionChoice = { id: string; name: string; colorHex: string | null };

/**
 * Every intention as a small pill with its color dot; the picked ones are
 * filled in. Clicking one picks or unpicks it. With `keepOne` (a saved
 * project, which always serves at least one intention), the last picked
 * pill can't be unpicked.
 */
export function IntentionChips({
  intentions,
  selectedIds,
  onToggle,
  keepOne = false,
}: {
  intentions: IntentionChoice[];
  selectedIds: string[];
  onToggle: (intentionId: string) => void;
  keepOne?: boolean;
}) {
  return (
    <div role="group" aria-label="Intentions" className="flex flex-wrap gap-1.5">
      {intentions.map((intention) => {
        const selected = selectedIds.includes(intention.id);
        const locked = keepOne && selected && selectedIds.length === 1;
        return (
          <button
            key={intention.id}
            type="button"
            aria-pressed={selected}
            aria-disabled={locked || undefined}
            title={locked ? "A project needs at least one intention" : undefined}
            onClick={() => {
              if (!locked) onToggle(intention.id);
            }}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm transition ${
              selected
                ? "border-primary/30 bg-primary/10 text-foreground"
                : "border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            } ${locked ? "cursor-default" : ""}`}
          >
            <span
              aria-hidden
              className="size-2.5 rounded-full"
              style={{
                backgroundColor: intention.colorHex ?? "currentColor",
                opacity: selected ? 1 : 0.5,
              }}
            />
            {intention.name}
          </button>
        );
      })}
    </div>
  );
}

/** Picks or unpicks one intention in a list of picked ids. */
export function toggleIntentionId(selectedIds: string[], intentionId: string) {
  return selectedIds.includes(intentionId)
    ? selectedIds.filter((id) => id !== intentionId)
    : [...selectedIds, intentionId];
}

/** A saved project's intention pills: each click shows at once and saves in the background. */
export function ProjectIntentionChips({
  intentions,
  selectedIds,
  saveAction,
}: {
  intentions: IntentionChoice[];
  selectedIds: string[];
  saveAction: (intentionIds: string[]) => Promise<void>;
}) {
  const [shownIds, showIds] = useOptimistic(selectedIds);
  const [, startTransition] = useTransition();

  return (
    <IntentionChips
      intentions={intentions}
      selectedIds={shownIds}
      keepOne
      onToggle={(intentionId) => {
        const newIds = toggleIntentionId(shownIds, intentionId);
        startTransition(async () => {
          showIds(newIds);
          await saveInBackground(() => saveAction(newIds));
        });
      }}
    />
  );
}
