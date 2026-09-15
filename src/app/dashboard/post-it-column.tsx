"use client";

import { useState } from "react";
import Image from "next/image";
import { useDraggable } from "@dnd-kit/core";
import { createPostItAction, deletePostItAction } from "@/app/actions/post-its";
import type { listPostIts } from "@/lib/post-its";

export function PostItColumn({
  postIts,
}: {
  postIts: Awaited<ReturnType<typeof listPostIts>>;
}) {
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex flex-wrap content-start gap-3 overflow-hidden">
        {/* Keyed on count so a successful create (which grows the list and
            revalidates this server-fed prop) remounts the ghost card back to
            its resting state instead of staying stuck in "editing". */}
        <PostItGhostCreate key={postIts.length} />
        {postIts.map((postIt) => (
          <PostItCard key={postIt.id} id={postIt.id} text={postIt.text} />
        ))}
      </div>
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
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { type: "postit", text },
  });

  return (
    <div
      ref={setNodeRef}
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
