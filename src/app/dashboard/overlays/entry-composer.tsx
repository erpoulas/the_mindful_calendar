"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Shuffle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// The writing box: written straight onto the page (no boxed field), tall
// enough to start writing and growing with what you type.
const WRITING_CLASSES =
  "field-sizing-content min-h-40 w-full resize-none rounded-md bg-transparent px-1 py-1 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground/70 focus-visible:bg-white/40";

const CHIP_CLASSES =
  "max-w-full truncate rounded-full border border-amber-900/15 px-3 py-1 text-left text-sm transition";

/**
 * Writing a new entry. The prompt is a line at the top you can type into
 * freely, and your saved prompts sit below it as chips: one click puts one
 * in, the shuffle button picks another at random, and the ✕ clears it.
 * Saving empties the page, and the entry shows up in the list below.
 */
export function EntryComposer({
  prompts,
  suggestedPrompt,
  createAction,
}: {
  prompts: { id: string; text: string }[];
  /** The prompt it opens with (a random saved one), if any. */
  suggestedPrompt?: string;
  createAction: (formData: FormData) => Promise<void>;
}) {
  const [prompt, setPrompt] = useState(suggestedPrompt ?? "");

  function shuffle() {
    const others = prompts.filter((saved) => saved.text !== prompt);
    if (others.length > 0) setPrompt(others[Math.floor(Math.random() * others.length)].text);
  }

  return (
    // A form action resets the form's fields after saving, so the writing box
    // empties for the next entry (the prompt is kept, in state).
    <form action={createAction} className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <input
          name="promptText"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Write a prompt, or pick one below"
          aria-label="Prompt"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-md bg-transparent px-1 py-0.5 font-handwritten text-xl outline-none placeholder:text-muted-foreground/60 focus-visible:bg-white/40"
        />
        {prompt && (
          <Button type="button" variant="ghost" size="icon-sm" aria-label="No prompt" title="No prompt" onClick={() => setPrompt("")}>
            <X aria-hidden />
          </Button>
        )}
        {prompts.length > 1 && (
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Another prompt" title="Another prompt" onClick={shuffle}>
            <Shuffle aria-hidden />
          </Button>
        )}
      </div>

      {prompts.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Saved prompts" role="group">
          {prompts.map((saved) => (
            <button
              key={saved.id}
              type="button"
              aria-pressed={saved.text === prompt}
              onClick={() => setPrompt(saved.text)}
              className={`${CHIP_CLASSES} ${
                saved.text === prompt
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/60 text-muted-foreground hover:bg-white hover:text-foreground"
              }`}
            >
              {saved.text}
            </button>
          ))}
        </div>
      )}

      <textarea
        name="content"
        aria-label="Entry"
        placeholder="Dear journal... (or leave it blank and write it later)"
        className={WRITING_CLASSES}
      />

      <div className="flex flex-wrap items-center justify-end gap-3">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Schedule for later
          <input
            name="startAt"
            type="datetime-local"
            className="rounded-md border border-input bg-white/60 px-2 py-1 text-xs"
          />
        </label>
        <SaveButton />
      </div>
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="rounded-full px-5">
      {pending ? "Saving..." : "Save entry"}
    </Button>
  );
}
