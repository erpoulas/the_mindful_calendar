"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import { isPendingItem, pendingItemId } from "@/lib/optimistic-list";
import { saveInBackground, useOptimisticList } from "./use-optimistic-list";

const CHIP_CLASSES =
  "flex max-w-full items-center rounded-full border border-amber-900/15 bg-white/60 text-sm text-muted-foreground transition hover:bg-white hover:text-foreground";

/**
 * A journal's saved prompts as chips: click one to put it on the page.
 * Adding works like a Quick Lists item: type on the blank chip at the end and
 * press Enter (it stays ready for the next). Each chip's ✕ removes it. Both
 * show at once and save in the background.
 */
export function PromptChips({
  prompts,
  onPick,
  addAction,
  deleteAction,
}: {
  prompts: { id: string; text: string }[];
  onPick: (text: string) => void;
  addAction: (formData: FormData) => Promise<void>;
  deleteAction: (promptId: string) => Promise<void>;
}) {
  const [shownPrompts, changeList] = useOptimisticList(prompts);
  const addFormRef = useRef<HTMLFormElement>(null);

  return (
    <div role="group" aria-label="Saved prompts" className="flex flex-wrap gap-1.5">
      {shownPrompts.map((prompt) => (
        <span key={prompt.id} className={`${CHIP_CLASSES} group min-w-0`}>
          <button
            type="button"
            onClick={() => onPick(prompt.text)}
            title="Add to the page"
            className="min-w-0 truncate py-1 pr-1 pl-3 text-left"
          >
            {prompt.text}
          </button>
          {!isPendingItem(prompt.id) && (
            <form
              action={async () => {
                changeList({ type: "remove", id: prompt.id });
                await saveInBackground(() => deleteAction(prompt.id));
              }}
              className="flex"
            >
              <button
                type="submit"
                aria-label={`Remove prompt: ${prompt.text}`}
                title="Remove prompt"
                // Shown on hover with a mouse; always there on touch screens.
                className="mr-1 rounded-full p-0.5 opacity-0 transition group-hover:opacity-100 hover:bg-amber-900/10 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
              >
                <X className="size-3" aria-hidden />
              </button>
            </form>
          )}
        </span>
      ))}

      <form
        ref={addFormRef}
        action={async (formData) => {
          const text = String(formData.get("text") ?? "").trim();
          if (!text) return;
          changeList({ type: "add", item: { id: pendingItemId(), text } });
          addFormRef.current?.reset();
          await saveInBackground(() => addAction(formData));
        }}
        className={`${CHIP_CLASSES} border-dashed`}
      >
        <input
          name="text"
          aria-label="New prompt"
          placeholder="New prompt"
          autoComplete="off"
          className="w-32 bg-transparent px-3 py-1 outline-none placeholder:text-muted-foreground/70"
        />
      </form>
    </div>
  );
}
