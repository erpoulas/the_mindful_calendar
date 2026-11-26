"use client";

import { useOptimistic, useState, useTransition } from "react";
import { saveInBackground } from "./use-optimistic-list";

// The two parts of a journal entry you can edit in place.
const FIELDS = {
  // The writing itself: several lines, so Enter starts a new one.
  content: { label: "Entry", emptyText: "Not written yet. Click to write.", multiline: true },
  // The prompt above it: one line, so Enter saves.
  promptText: { label: "Prompt", emptyText: "Add a prompt", multiline: false },
};

/**
 * A journal entry's text (or its prompt), shown as it reads on the page.
 * Clicking it turns it into a writing box right there, with the cursor at
 * the end; clicking away saves (the new text shows at once and saves in the
 * background) and Escape throws the edit away. Clearing it is allowed: a
 * blank entry waits to be written, and a cleared prompt is removed.
 */
export function EditableEntryText({
  entryId,
  text,
  field = "content",
  saveAction,
  className = "",
}: {
  entryId: string;
  text: string | null;
  field?: keyof typeof FIELDS;
  saveAction: (entryId: string, formData: FormData) => Promise<void>;
  /** Styling shared by the text and its box, so editing doesn't shift it. */
  className?: string;
}) {
  const { label, emptyText, multiline } = FIELDS[field];
  const [editing, setEditing] = useState(false);
  const [shownText, showText] = useOptimistic(text ?? "");
  const [, startTransition] = useTransition();

  function save(newText: string) {
    setEditing(false);
    if (newText.trim() === shownText.trim()) return;
    const formData = new FormData();
    formData.set(field, newText);
    startTransition(async () => {
      showText(newText.trim());
      await saveInBackground(() => saveAction(entryId, formData));
    });
  }

  if (editing) {
    return (
      <textarea
        autoFocus
        rows={1}
        defaultValue={shownText}
        aria-label={label}
        // Pick up where the text ends, to keep writing.
        onFocus={(event) => {
          const box = event.currentTarget;
          box.setSelectionRange(box.value.length, box.value.length);
        }}
        onBlur={(event) => save(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !multiline) {
            event.preventDefault();
            event.currentTarget.blur();
          } else if (event.key === "Escape") {
            // Keep Escape from also closing the popup.
            event.stopPropagation();
            setEditing(false);
          }
        }}
        className={`${className} field-sizing-content block w-full resize-none rounded-sm bg-primary/5 outline-none`}
      />
    );
  }

  return (
    <button
      type="button"
      title="Click to edit"
      onClick={() => setEditing(true)}
      className={`${className} block w-full cursor-text text-left whitespace-pre-wrap ${
        shownText ? "" : "text-muted-foreground"
      }`}
    >
      {shownText || emptyText}
    </button>
  );
}
