"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarPlus, Check, StickyNote } from "lucide-react";
import { saveInBackground } from "./use-optimistic-list";

// The small icon buttons at the end of a list row (quick-list items,
// project tasks, dopamine-menu items). Put `group` on the row and wrap the
// icons in <RowActions>: they stay hidden until you hover the row or tab
// to them, so a plain list reads like a checklist. Touch screens can't
// hover, so there they always show, but faint.

const iconButtonClass =
  "inline-flex rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground";

export function RowActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-60">
      {children}
    </div>
  );
}

/** Opens the New event form, already filled in for this row. */
export function ScheduleIconLink({ href }: { href: string }) {
  return (
    <Link href={href} aria-label="Schedule" title="Schedule" className={iconButtonClass}>
      <CalendarPlus className="size-4" aria-hidden />
    </Link>
  );
}

/** A submit button for a form whose action makes a post-it from this row. */
export function PostItIconButton({ label }: { label: string }) {
  return (
    <button type="submit" aria-label={label} title={label} className={iconButtonClass}>
      <StickyNote className="size-4" aria-hidden />
    </button>
  );
}

/**
 * Makes a post-it from `text` but keeps the row (dopamine-menu items are
 * meant to be reused). The row doesn't change, so the icon turns into a
 * check mark for a moment once the post-it is saved.
 */
export function CopyToPostItButton({
  text,
  createPostItAction,
}: {
  text: string;
  createPostItAction: (formData: FormData) => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <form
      action={async (formData) => {
        if (await saveInBackground(() => createPostItAction(formData))) setCopied(true);
      }}
    >
      <input type="hidden" name="text" value={text} />
      {copied ? (
        <span
          role="status"
          aria-label="Added to post-its"
          title="Added to post-its"
          className={iconButtonClass}
        >
          <Check className="size-4" aria-hidden />
        </span>
      ) : (
        <PostItIconButton label="Make a post-it" />
      )}
    </form>
  );
}
