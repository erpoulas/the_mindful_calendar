"use client";

import type { CSSProperties } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { createPostItAction, deletePostItAction } from "@/app/actions/post-its";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { listPostIts } from "@/lib/post-its";

export function PostItTray({
  postIts,
}: {
  postIts: Awaited<ReturnType<typeof listPostIts>>;
}) {
  return (
    <div className="flex flex-col gap-2 rounded border p-3">
      <h2 className="text-xs font-medium text-zinc-500">
        📌 POST-ITS — drag one onto a day to schedule it
      </h2>

      <div className="flex flex-wrap gap-3">
        {postIts.length === 0 && (
          <p className="text-sm text-zinc-500">
            No post-its yet — jot one below, or promote a quick-list item.
          </p>
        )}
        {postIts.map((postIt) => (
          <PostItCard key={postIt.id} id={postIt.id} text={postIt.text} />
        ))}
      </div>

      <form action={createPostItAction} className="flex max-w-sm gap-2">
        <Input name="text" placeholder="Jot a quick note" required />
        <Button type="submit" size="sm">
          Add
        </Button>
      </form>
    </div>
  );
}

function PostItCard({ id, text }: { id: string; text: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { type: "postit", text },
  });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative w-36 -rotate-1 touch-none rounded bg-yellow-100 p-2 pt-3 text-sm shadow odd:rotate-1 ${
        isDragging ? "cursor-grabbing opacity-80" : "cursor-grab"
      }`}
    >
      <form action={deletePostItAction.bind(null, id)} className="absolute top-0.5 right-1">
        <button
          type="submit"
          aria-label="Dismiss post-it"
          className="text-xs text-zinc-500 hover:text-zinc-800"
        >
          ✕
        </button>
      </form>
      <p className="break-words pr-2">{text}</p>
    </div>
  );
}
