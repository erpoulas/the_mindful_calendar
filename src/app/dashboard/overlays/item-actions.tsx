"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarPlus, Check, Play, StickyNote } from "lucide-react";
import { saveInBackground } from "./use-optimistic-list";

// The small icon buttons at the end of a list row (quick-list items,
// project tasks, dopamine-menu items). Put `group` on the row and wrap the
// icons in <RowActions>: they stay hidden until you hover the row or tab
// to them, so a plain list reads like a checklist. Touch screens can't
// hover, so there they always show, but faint.

export const iconButtonClass =
  "inline-flex rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground";

export function RowActions({
  children,
  className = "",
}: {
  children: React.ReactNode;
  /** Extra classes, e.g. to float the icons over the row instead of beside it. */
  className?: string;
}) {
  return (
    <div
      className={`flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-60 ${className}`}
    >
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
 * An icon button whose save leaves the row as it is, so the icon turns into
 * a check mark for a moment once the save works (and not if it fails).
 */
function IconButtonWithCheck({
  icon,
  label,
  doneLabel,
  save,
}: {
  icon: React.ReactNode;
  label: string;
  doneLabel: string;
  save: () => Promise<unknown>;
}) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setDone(false), 2000);
    return () => clearTimeout(timer);
  }, [done]);

  return (
    <form
      action={async () => {
        if (await saveInBackground(save)) setDone(true);
      }}
    >
      {done ? (
        <span role="status" aria-label={doneLabel} title={doneLabel} className={iconButtonClass}>
          <Check className="size-4" aria-hidden />
        </span>
      ) : (
        <button type="submit" aria-label={label} title={label} className={iconButtonClass}>
          {icon}
        </button>
      )}
    </form>
  );
}

/**
 * Makes a post-it from `text` but keeps the row (dopamine-menu items are
 * meant to be reused).
 */
export function CopyToPostItButton({
  text,
  createPostItAction,
}: {
  text: string;
  createPostItAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <IconButtonWithCheck
      icon={<StickyNote className="size-4" aria-hidden />}
      label="Make a post-it"
      doneLabel="Added to post-its"
      save={() => {
        const formData = new FormData();
        formData.set("text", text);
        return createPostItAction(formData);
      }}
    />
  );
}

/** "Start now": adds a 1-hour event, starting this minute, from the row. */
export function StartNowButton({
  itemId,
  startNowAction,
}: {
  itemId: string;
  startNowAction: (itemId: string) => Promise<void>;
}) {
  return (
    <IconButtonWithCheck
      icon={<Play className="size-4" aria-hidden />}
      label="Start now (adds a 1-hour event)"
      doneLabel="Added to your calendar"
      save={() => startNowAction(itemId)}
    />
  );
}
