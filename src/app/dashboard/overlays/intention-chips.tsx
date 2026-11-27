"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Plus } from "lucide-react";
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

/**
 * A saved project's intentions, kept quiet: just the picked ones as small
 * dots and names, with a "+" that opens every intention's pill to pick or
 * unpick (each click shows at once and saves in the background), and "Done"
 * to fold them away again.
 */
export function ProjectIntentionChips({
  intentions,
  selectedIds,
  saveAction,
}: {
  intentions: IntentionChoice[];
  selectedIds: string[];
  saveAction: (intentionIds: string[]) => Promise<void>;
}) {
  const [choosing, setChoosing] = useState(false);
  const [shownIds, showIds] = useOptimistic(selectedIds);
  const [, startTransition] = useTransition();

  if (!choosing) {
    return (
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-muted-foreground">
        {intentions
          .filter((intention) => shownIds.includes(intention.id))
          .map((intention) => (
            <span key={intention.id} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-2.5 rounded-full"
                style={{ backgroundColor: intention.colorHex ?? "currentColor" }}
              />
              {intention.name}
            </span>
          ))}
        <button
          type="button"
          aria-label="Change intentions"
          title="Change intentions"
          onClick={() => setChoosing(true)}
          className="rounded p-0.5 hover:bg-accent hover:text-foreground"
        >
          <Plus className="size-3.5" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
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
      <button
        type="button"
        onClick={() => setChoosing(false)}
        className="rounded-full px-2 py-0.5 text-sm font-medium text-primary hover:bg-primary/10"
      >
        Done
      </button>
    </div>
  );
}
