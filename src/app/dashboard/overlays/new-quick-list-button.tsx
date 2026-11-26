"use client";

import { useState } from "react";

/**
 * Starts a new quick list in place: clicking it swaps it for a small name
 * box, and pressing Enter creates the list (the action then opens it in the
 * same popup). Escape, or leaving the box empty, turns it back into the button.
 */
export function NewQuickListButton({
  createAction,
  className = "",
  inputClassName = "",
  children,
}: {
  createAction: (formData: FormData) => Promise<void>;
  /** The button's look; the box keeps the same outline so the row doesn't jump. */
  className?: string;
  inputClassName?: string;
  children: React.ReactNode;
}) {
  const [naming, setNaming] = useState(false);

  if (!naming) {
    return (
      <button
        type="button"
        aria-label="New list"
        title="New list"
        onClick={() => setNaming(true)}
        className={className}
      >
        {children}
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        if (!String(formData.get("name") ?? "").trim()) return setNaming(false);
        await createAction(formData);
        setNaming(false);
      }}
      className={className}
    >
      <input
        name="name"
        autoFocus
        autoComplete="off"
        placeholder="List name"
        aria-label="New list name"
        onBlur={(event) => {
          if (!event.currentTarget.value.trim()) setNaming(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            // Keep Escape from also closing the popup.
            event.stopPropagation();
            setNaming(false);
          }
        }}
        className={`w-28 bg-transparent outline-none placeholder:text-muted-foreground/70 ${inputClassName}`}
      />
    </form>
  );
}
