"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  createPostItAction,
  deletePostItAction,
  updatePostItTextAction,
} from "@/app/actions/post-its";
import { TITLE_MAX_LENGTH } from "@/lib/calendar-event-schemas";
import { sortByOrder } from "@/lib/dropped-positions";
import type { listPostIts } from "@/lib/post-its";
import { useDroppedPositions } from "./dropped-positions-context";

// How many post-its the permanent column shows before overflowing into the
// "+N more" pop-out — same fixed-cap approach used for month-grid day cells,
// rather than giving the column its own scrollbar.
const VISIBLE_CAP = 5;

export function PostItColumn({
  postIts: savedPostIts,
  capped = false,
}: {
  postIts: Awaited<ReturnType<typeof listPostIts>>;
  capped?: boolean;
}) {
  // A post-it just dragged to a new spot stays there while the order is saved.
  const postIts = sortByOrder(savedPostIts, useDroppedPositions().postItOrder, (postIt) => postIt.id);
  const shown = capped ? postIts.slice(0, VISIBLE_CAP) : postIts;
  const overflow = postIts.length - shown.length;

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex flex-wrap content-start gap-3 overflow-hidden">
        {/* Keyed on count so a successful create (which grows the list and
            revalidates this server-fed prop) remounts the ghost card back to
            its resting state instead of staying stuck in "editing". */}
        <PostItGhostCreate key={postIts.length} />
        <SortableContext items={shown.map((postIt) => postIt.id)} strategy={rectSortingStrategy}>
          {shown.map((postIt) => (
            <PostItCard key={postIt.id} id={postIt.id} text={postIt.text} />
          ))}
        </SortableContext>
      </div>
      {overflow > 0 && (
        <Link
          href="/dashboard?panel=postits"
          className="text-xs text-muted-foreground hover:underline"
        >
          +{overflow} more
        </Link>
      )}
    </div>
  );
}

function PostItGhostCreate() {
  const [isCreating, setIsCreating] = useState(false);

  if (!isCreating) {
    return (
      <button
        type="button"
        onClick={() => setIsCreating(true)}
        className="relative w-28 -rotate-1 cursor-pointer text-left opacity-50 hover:opacity-70"
      >
        <PostItImage />
        <span className="font-handwritten absolute inset-x-3 top-9 bottom-2 flex items-center justify-center text-center text-sm leading-snug">
          Create new post-it
        </span>
      </button>
    );
  }

  return (
    <form action={createPostItAction} className="relative w-28 -rotate-1">
      <PostItImage />
      <input
        name="text"
        autoFocus
        required
        maxLength={TITLE_MAX_LENGTH}
        onBlur={(e) => {
          if (!e.currentTarget.value) setIsCreating(false);
        }}
        placeholder="Type a note..."
        className="font-handwritten absolute inset-x-3 top-9 bottom-2 border-none bg-transparent text-sm leading-snug break-words outline-none"
      />
    </form>
  );
}

function PostItImage() {
  return (
    <Image
      src="/panel-art/post-it-icon.png"
      alt=""
      width={170}
      height={185}
      draggable={false}
      className="pointer-events-none h-auto w-full drop-shadow-sm select-none"
    />
  );
}

// The visual-only note face, shared between the in-column card and the
// DragOverlay preview rendered in calendar-dnd.tsx (so the dragged image
// isn't clipped by the column's own overflow-hidden). Always clipped, not
// expandable — it's a snapshot shown only while actively dragging.
export function PostItVisual({ text }: { text: string }) {
  return (
    <>
      <PostItImage />
      <p className="font-handwritten absolute inset-x-3 top-9 bottom-2 overflow-hidden text-sm leading-snug break-words">
        {text}
      </p>
    </>
  );
}

function PostItCard({ id, text }: { id: string; text: string }) {
  const [isEditing, setIsEditing] = useState(false);
  // Optimistic values show the change the moment you make it, instead of
  // waiting for the server to save it and the whole dashboard to reload.
  // React drops them once the reload brings in the real data.
  const [shownText, showText] = useOptimistic(text);
  const [isDismissed, markDismissed] = useOptimistic(false);
  const [, startTransition] = useTransition();
  const { attributes, listeners, setNodeRef, isDragging, transform, transition } = useSortable({
    id,
    data: { type: "postit", text: shownText },
    // Dragging is switched off while editing so you can click and select text.
    disabled: isEditing,
  });
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    setIsOverflowing(!!el && el.scrollHeight > el.clientHeight);
  }, [shownText, isEditing]);

  if (isDismissed) return null;

  function saveText(formData: FormData) {
    setIsEditing(false);
    const newText = String(formData.get("text") ?? "").trim();
    // Clearing the note or leaving it unchanged just closes the editor.
    if (!newText || newText === shownText) return;
    startTransition(async () => {
      showText(newText);
      await updatePostItTextAction(id, formData);
    });
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className="relative w-28 -rotate-1 odd:rotate-1">
        <PostItImage />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveText(new FormData(e.currentTarget));
          }}
          className="absolute inset-x-3 top-9 bottom-2"
        >
          <textarea
            name="text"
            autoFocus
            defaultValue={shownText}
            maxLength={TITLE_MAX_LENGTH}
            aria-label="Post-it text"
            onFocus={(e) => e.currentTarget.select()}
            onBlur={(e) => e.currentTarget.form?.requestSubmit()}
            onKeyDown={(e) => {
              // Enter saves (Shift+Enter is a new line); Escape throws the edit away.
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.blur();
              } else if (e.key === "Escape") {
                e.currentTarget.value = shownText;
                e.currentTarget.blur();
              }
            }}
            className="font-handwritten h-full w-full resize-none border-none bg-transparent text-sm leading-snug break-words outline-none"
          />
        </form>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative w-28 -rotate-1 touch-none odd:rotate-1 ${
        isDragging ? "cursor-grabbing opacity-30" : "cursor-grab"
      }`}
    >
      <PostItImage />
      {/* A plain click edits the note; dnd-kit only starts a drag after the
          pointer moves 8px, and it swallows the click that ends a drag. */}
      <p
        ref={textRef}
        onClick={() => setIsEditing(true)}
        title="Click to edit"
        className={`font-handwritten absolute inset-x-3 top-9 bottom-2 cursor-text text-sm leading-snug break-words ${
          expanded ? "overflow-y-auto" : "overflow-hidden"
        }`}
      >
        {shownText}
      </p>
      {isOverflowing && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-label={expanded ? "Show less of this note" : "Show the full note"}
          className="absolute right-1 bottom-1 flex h-4 w-4 items-center justify-center rounded-full bg-background/80 text-xs leading-none text-muted-foreground hover:text-foreground"
        >
          {expanded ? "−" : "+"}
        </button>
      )}
      <form
        action={async () => {
          markDismissed(true);
          await deletePostItAction(id);
        }}
        className="absolute top-1 right-1"
      >
        <button
          type="submit"
          aria-label="Dismiss post-it"
          className="flex h-7 w-7 items-center justify-center rounded-full text-base text-muted-foreground hover:bg-background/60 hover:text-foreground"
        >
          ✕
        </button>
      </form>
    </div>
  );
}
