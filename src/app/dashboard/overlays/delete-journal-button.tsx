"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The journal's trash icon. It opens a small question under it: deleting a
 * journal always takes its journal time and any future entry events off the
 * calendars, and when it has entries it asks whether their past events go
 * too ("Yes, delete them") or stay on the calendar ("No, keep them").
 */
export function DeleteJournalButton({
  journalName,
  entryCount,
  deleteAction,
}: {
  journalName: string;
  entryCount: number;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isDeleting, startTransition] = useTransition();

  function remove(pastEvents: "delete" | "keep") {
    const formData = new FormData();
    formData.set("pastEvents", pastEvents);
    startTransition(() => deleteAction(formData));
  }

  return (
    <div className="relative shrink-0">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Delete journal"
        title="Delete journal"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="text-destructive"
      >
        <Trash2 aria-hidden />
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label={`Delete ${journalName}`}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
          className="absolute top-full right-0 z-20 mt-1 flex w-[min(19rem,75vw)] flex-col gap-3 rounded-2xl border border-amber-900/15 bg-white p-4 text-sm shadow-lg"
        >
          <p>
            Delete “{journalName}” and all its pages? Its journal time comes off your calendars too. This
            can&apos;t be undone.
          </p>
          {entryCount > 0 ? (
            <>
              <p className="font-medium">
                {entryCount === 1
                  ? "Also delete the event of its past entry from your calendar?"
                  : `Also delete the events of its ${entryCount} past entries from your calendar?`}
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" disabled={isDeleting} onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={isDeleting} onClick={() => remove("keep")}>
                  No, keep them
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => remove("delete")}
                >
                  Yes, delete them
                </Button>
              </div>
            </>
          ) : (
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" disabled={isDeleting} onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={() => remove("keep")}
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
