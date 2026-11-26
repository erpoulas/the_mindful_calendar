"use client";

import { useOptimistic, useState, useTransition } from "react";
import { saveInBackground } from "./use-optimistic-list";

/**
 * A quick list's name as its heading. Clicking it turns it into a text box
 * right there; Enter or clicking away saves (the new name shows at once and
 * saves in the background), Escape throws the edit away. An empty or
 * unchanged name just closes the box.
 */
export function QuickListName({
  listId,
  name,
  renameAction,
  className = "",
}: {
  listId: string;
  name: string;
  renameAction: (listId: string, formData: FormData) => Promise<void>;
  /** Styling shared by the heading and its text box, so editing doesn't shift it. */
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [shownName, showName] = useOptimistic(name);
  const [, startTransition] = useTransition();

  function save(formData: FormData) {
    setEditing(false);
    const newName = String(formData.get("name") ?? "").trim();
    if (!newName || newName === shownName) return;
    startTransition(async () => {
      showName(newName);
      await saveInBackground(() => renameAction(listId, formData));
    });
  }

  if (editing) {
    return (
      <form
        className="min-w-0 flex-1"
        onSubmit={(event) => {
          event.preventDefault();
          save(new FormData(event.currentTarget));
        }}
      >
        <textarea
          name="name"
          rows={1}
          autoFocus
          defaultValue={shownName}
          aria-label="List name"
          onFocus={(event) => event.currentTarget.select()}
          onBlur={(event) => event.currentTarget.form?.requestSubmit()}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              // A name is one line: Enter saves rather than starting a new line.
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            } else if (event.key === "Escape") {
              // Keep Escape from also closing the popup.
              event.stopPropagation();
              setEditing(false);
            }
          }}
          className={`${className} field-sizing-content block w-full resize-none rounded-sm bg-primary/5 outline-none`}
        />
      </form>
    );
  }

  return (
    // Takes the row's free room and no more, so a long name wraps before
    // it reaches anything beside it (the trash icon).
    <h2 className="min-w-0 flex-1">
      <button
        type="button"
        title="Click to rename"
        onClick={() => setEditing(true)}
        className={`${className} max-w-full cursor-text text-left`}
      >
        {shownName}
      </button>
    </h2>
  );
}
