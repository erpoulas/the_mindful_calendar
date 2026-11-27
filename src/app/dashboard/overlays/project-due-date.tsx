"use client";

import { useOptimistic, useState, useTransition } from "react";
import { CalendarDays, X } from "lucide-react";
import { dueDateFromInput, formatDueDate } from "@/lib/project-due-date";
import { describeDueDate } from "@/lib/project-progress";
import { saveInBackground } from "./use-optimistic-list";

/**
 * A project's optional due date as a countdown: "9 days to go", tinted amber
 * in the last few days (hover for the date itself), or "Add a due date".
 * Clicking it turns it into a date box; picking a day and clicking
 * away saves it, and the ✕ clears it. Each change shows at once and saves in
 * the background.
 */
export function ProjectDueDate({
  dueDate,
  today,
  saveAction,
}: {
  /** The date box's value, e.g. "2026-10-12", or "" for none. */
  dueDate: string;
  /** The user's today in their time zone, the same way ("2026-11-26"). */
  today: string;
  /** Saves a date box value; "" clears the due date. */
  saveAction: (value: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [shownDate, showDate] = useOptimistic(dueDate);
  const [, startTransition] = useTransition();
  const shownDay = dueDateFromInput(shownDate);
  const todayDay = dueDateFromInput(today);
  const countdown = shownDay && todayDay ? describeDueDate(shownDay, todayDay) : null;

  function save(value: string) {
    setEditing(false);
    const newDate = dueDateFromInput(value) ? value : "";
    if (newDate === shownDate) return;
    startTransition(async () => {
      showDate(newDate);
      await saveInBackground(() => saveAction(newDate));
    });
  }

  if (editing) {
    return (
      <input
        type="date"
        autoFocus
        aria-label="Due date"
        defaultValue={shownDate}
        onBlur={(event) => save(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          } else if (event.key === "Escape") {
            // Keep Escape from also closing the popup.
            event.stopPropagation();
            setEditing(false);
          }
        }}
        className="rounded-sm bg-primary/5 px-1 text-sm outline-none"
      />
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setEditing(true)}
        title={shownDay ? `Due ${formatDueDate(shownDay)}` : undefined}
        className={`inline-flex items-center gap-1.5 rounded-sm text-sm hover:text-foreground ${
          countdown?.soon ? "text-amber-700" : "text-muted-foreground"
        }`}
      >
        <CalendarDays className="size-4" aria-hidden />
        {countdown ? countdown.label : "Add a due date"}
      </button>
      {shownDay && (
        <button
          type="button"
          aria-label="Clear due date"
          title="Clear due date"
          onClick={() => save("")}
          className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}
