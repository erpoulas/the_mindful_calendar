"use client";

import { useState } from "react";
import {
  clearTodayAffirmationAction,
  pickAffirmationAction,
  setTodayAffirmationAction,
} from "@/app/actions/affirmations";
import { Button } from "@/components/ui/button";
import { KEEP_AFFIRMATION_FOR, KEEP_AFFIRMATION_LABELS } from "@/lib/affirmation-schemas";

/**
 * Today's affirmation at the top of the Affirmations popup. Click it to edit
 * the text and choose how long to keep it; until then a random one from the
 * list shows. A kept one can be ended early with "Back to random".
 */
export function AffirmationOfTheDay({
  text,
  keptUntilLabel,
  hasList,
}: {
  /** null when there's nothing to show yet. */
  text: string | null;
  /** Set only while a chosen affirmation is kept, e.g. "Until Dec 3". */
  keptUntilLabel: string | null;
  hasList: boolean;
}) {
  const [editing, setEditing] = useState(false);

  async function save(formData: FormData) {
    await setTodayAffirmationAction(formData);
    setEditing(false);
  }

  if (editing) {
    return (
      <form action={save} className="flex flex-col gap-3 rounded border p-4">
        <textarea
          name="text"
          aria-label="Today's affirmation"
          defaultValue={text ?? ""}
          placeholder="Today, I..."
          required
          autoFocus
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              // Keep Escape from also closing the popup.
              event.stopPropagation();
              setEditing(false);
            }
          }}
          className="field-sizing-content w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-center text-lg outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <div className="flex flex-wrap items-center justify-center gap-2">
          <select
            name="keepFor"
            aria-label="Keep it"
            defaultValue="today"
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {KEEP_AFFIRMATION_FOR.map((choice) => (
              <option key={choice} value={choice}>
                {KEEP_AFFIRMATION_LABELS[choice]}
              </option>
            ))}
          </select>
          <Button type="submit">Save</Button>
          <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="rounded border p-4 text-center">
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Edit today's affirmation"
        className="w-full rounded-sm text-lg hover:bg-primary/5"
      >
        {text ?? "Write one for today"}
      </button>
      {keptUntilLabel ? (
        <div className="mt-1 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>{keptUntilLabel}</span>
          <form action={clearTodayAffirmationAction}>
            <Button type="submit" variant="link" size="xs">
              Back to random
            </Button>
          </form>
        </div>
      ) : (
        hasList && (
          <form action={pickAffirmationAction} className="mt-3">
            <Button type="submit" variant="outline">
              Show a different one
            </Button>
          </form>
        )
      )}
    </div>
  );
}
