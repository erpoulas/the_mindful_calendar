"use client";

import { useOptimistic, useState, useTransition } from "react";
import { saveInBackground } from "./use-optimistic-list";

/**
 * A name (a quick list's, a journal's, a project's) as its heading, or with
 * `as="p"` a line of text such as a project's end goal. Clicking it turns it into a text box
 * right there; Enter or clicking away saves (the new name shows at once and
 * saves in the background), Escape throws the edit away. An empty or
 * unchanged name just closes the box.
 */
export function EditableName({
  id,
  name,
  label,
  renameAction,
  fieldName = "name",
  as: Wrapper = "h2",
  className = "",
}: {
  /** What's being renamed, passed on to renameAction. */
  id: string;
  name: string;
  /** The text box's label, e.g. "List name". */
  label: string;
  renameAction: (id: string, formData: FormData) => Promise<void>;
  /** The form field the text is sent as (renameAction reads it). */
  fieldName?: string;
  /** The element shown when not editing: a heading, or a paragraph. */
  as?: "h2" | "p";
  /** Styling shared by the heading and its text box, so editing doesn't shift it. */
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [shownName, showName] = useOptimistic(name);
  const [, startTransition] = useTransition();

  function save(formData: FormData) {
    setEditing(false);
    const newName = String(formData.get(fieldName) ?? "").trim();
    if (!newName || newName === shownName) return;
    startTransition(async () => {
      showName(newName);
      await saveInBackground(() => renameAction(id, formData));
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
          name={fieldName}
          rows={1}
          autoFocus
          defaultValue={shownName}
          aria-label={label}
          onFocus={(event) => event.currentTarget.select()}
          onBlur={(event) => event.currentTarget.form?.requestSubmit()}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              // One line: Enter saves rather than starting a new line.
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
    <Wrapper className="min-w-0 flex-1">
      <button
        type="button"
        title={`Click to edit (${label.toLowerCase()})`}
        onClick={() => setEditing(true)}
        className={`${className} max-w-full cursor-text text-left`}
      >
        {shownName}
      </button>
    </Wrapper>
  );
}
