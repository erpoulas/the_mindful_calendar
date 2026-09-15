"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createPostItAction, deletePostItAction } from "@/app/actions/post-its";
import { TITLE_MAX_LENGTH } from "@/lib/calendar-event-schemas";
import type { listPostIts } from "@/lib/post-its";

// How many post-its the permanent column shows before overflowing into the
// "+N more" pop-out — same fixed-cap approach used for month-grid day cells,
// rather than giving the column its own scrollbar.
const VISIBLE_CAP = 5;

export function PostItColumn({
  postIts,
  capped = false,
}: {
  postIts: Awaited<ReturnType<typeof listPostIts>>;
  capped?: boolean;
}) {
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
        <Image
          src="/panel-art/post-it-icon.png"
          alt=""
          width={170}
          height={185}
          draggable={false}
          className="pointer-events-none h-auto w-full drop-shadow-sm select-none"
        />
        <span className="font-handwritten absolute inset-x-3 top-9 bottom-2 flex items-center justify-center text-center text-sm leading-snug">
          Create new post-it
        </span>
      </button>
    );
  }

  return (
    <form action={createPostItAction} className="relative w-28 -rotate-1">
      <Image
        src="/panel-art/post-it-icon.png"
        alt=""
        width={170}
        height={185}
        draggable={false}
        className="pointer-events-none h-auto w-full drop-shadow-sm select-none"
      />
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

// The visual-only note face, shared between the in-column card and the
// DragOverlay preview rendered in calendar-dnd.tsx (so the dragged image
// isn't clipped by the column's own overflow-hidden).
export function PostItVisual({ text }: { text: string }) {
  return (
    <>
      <Image
        src="/panel-art/post-it-icon.png"
        alt=""
        width={170}
        height={185}
        draggable={false}
        className="pointer-events-none h-auto w-full drop-shadow-sm select-none"
      />
      <p className="font-handwritten absolute inset-x-3 top-9 bottom-2 overflow-hidden text-sm leading-snug break-words">
        {text}
      </p>
    </>
  );
}

function PostItCard({ id, text }: { id: string; text: string }) {
  const { attributes, listeners, setNodeRef, isDragging, transform, transition } = useSortable({
    id,
    data: { type: "postit", text },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
      <PostItVisual text={text} />
      <form action={deletePostItAction.bind(null, id)} className="absolute top-1 right-1">
        <button
          type="submit"
          aria-label="Dismiss post-it"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </form>
    </div>
  );
}
