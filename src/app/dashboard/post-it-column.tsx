"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { createPostItAction, deletePostItAction } from "@/app/actions/post-its";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { listPostIts } from "@/lib/post-its";

export function PostItColumn({
  postIts,
}: {
  postIts: Awaited<ReturnType<typeof listPostIts>>;
}) {
  return (
    <div className="flex h-full flex-col gap-2">
      <h2 className="text-xs font-medium text-muted-foreground">
        📌 POST-ITS — drag one onto a day to schedule it
      </h2>

      <div className="flex flex-wrap content-start gap-3 overflow-hidden">
        {postIts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No post-its yet — jot one below, or promote a quick-list item.
          </p>
        )}
        {postIts.map((postIt) => (
          <PostItCard key={postIt.id} id={postIt.id} text={postIt.text} />
        ))}
      </div>

      <form action={createPostItAction} className="flex gap-2">
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
      className={`relative w-28 -rotate-1 touch-none odd:rotate-1 ${
        isDragging ? "cursor-grabbing opacity-80" : "cursor-grab"
      }`}
    >
      <Image
        src="/panel-art/post-it-icon.png"
        alt=""
        width={170}
        height={185}
        draggable={false}
        className="pointer-events-none h-auto w-full drop-shadow-sm select-none"
      />
      <form action={deletePostItAction.bind(null, id)} className="absolute top-1 right-1">
        <button
          type="submit"
          aria-label="Dismiss post-it"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </form>
      <p className="font-handwritten absolute inset-x-3 top-9 bottom-2 overflow-hidden text-sm leading-snug break-words">
        {text}
      </p>
    </div>
  );
}
