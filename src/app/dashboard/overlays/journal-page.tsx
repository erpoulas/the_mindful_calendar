"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Shuffle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  parseJournalPage,
  pickPromptToAdd,
  serializeJournalPage,
  type JournalPageBlock,
} from "@/lib/journal-page";
import { PromptChips } from "./prompt-chips";
import { saveInBackground } from "./use-optimistic-list";

// Each block on screen gets its own key, so React keeps the right box (and
// its cursor) when blocks are added or taken away.
type Block = JournalPageBlock & { key: number };
let lastBlockKey = 0;
function withKeys(blocks: JournalPageBlock[]): Block[] {
  return blocks.map((block) => ({ ...block, key: ++lastBlockKey }));
}

// Prompts and writing share one look, so the page reads as a single box;
// prompts are set apart only by italics. Long words wrap: never a sideways scroll.
const BOX_CLASSES =
  "field-sizing-content block w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none wrap-anywhere placeholder:text-muted-foreground/70";

const STATUS_TEXT = { saving: "Saving...", saved: "Saved", error: "Couldn't save. It will try again." };

/**
 * One journal page: a single writing box where prompts sit as italic lines,
 * each with your writing under it. There is no Save button: it saves a
 * moment after you stop typing, and at once when you click away or close.
 *
 * Without `entry` it is today's page, not saved yet: the first thing written
 * creates the entry (`createAction`), and later saves update that same one.
 * With `savedPrompts`, the journal's prompts sit under it as chips; picking
 * one adds it at the end of the page, ready to answer. With `deleteAction`,
 * a saved page gets a trash icon that deletes it and leaves a blank page.
 */
export function JournalPage({
  entry,
  suggestedPrompt,
  savedPrompts,
  createAction,
  updateAction,
  addPromptAction,
  deletePromptAction,
  deleteAction,
  autosaveDelayMs = 800,
}: {
  entry?: { id: string; content: string | null; promptText: string | null };
  /** For a new page: a prompt to start from. It is only saved once you write. */
  suggestedPrompt?: string;
  savedPrompts?: { id: string; text: string }[];
  createAction?: (formData: FormData) => Promise<string | null>;
  updateAction: (entryId: string, formData: FormData) => Promise<void>;
  addPromptAction?: (formData: FormData) => Promise<void>;
  deletePromptAction?: (promptId: string) => Promise<void>;
  deleteAction?: (entryId: string) => Promise<void>;
  autosaveDelayMs?: number;
}) {
  const [blocks, setBlocks] = useState(() =>
    withKeys(
      entry
        ? parseJournalPage(entry.content, entry.promptText)
        : parseJournalPage(suggestedPrompt ? `*${suggestedPrompt}*` : null),
    ),
  );
  const [status, setStatus] = useState<keyof typeof STATUS_TEXT | null>(null);
  // Whether the page has been saved as an entry yet (so it can be deleted).
  const [isSaved, setIsSaved] = useState(Boolean(entry));

  // What saving needs between renders. Refs, not state: changing them
  // shouldn't redraw the page.
  const latestBlocks = useRef(blocks);
  // What the server has, so an unchanged page isn't saved again. A new page
  // counts its suggested prompt as unchanged, so just opening it saves nothing.
  const savedContent = useRef<string | null>(null);
  const entryId = useRef(entry?.id ?? null);
  // The first save of a new page, while it creates the entry: later saves
  // wait for it, then update that entry instead of creating another.
  const creating = useRef<Promise<string | null> | null>(null);
  // Older entries kept their prompt separately; the first save moves it onto the page.
  const hasLegacyPrompt = useRef(Boolean(entry?.promptText));
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxes = useRef(new Map<number, HTMLTextAreaElement>());
  const focusNext = useRef<{ key: number; at: "start" | "end" } | null>(null);

  useEffect(() => {
    savedContent.current ??= serializeJournalPage(latestBlocks.current);
  }, []);

  // Puts the cursor in a box that was just added or moved to.
  useEffect(() => {
    const target = focusNext.current;
    const box = target && boxes.current.get(target.key);
    if (!target || !box) return;
    focusNext.current = null;
    box.focus();
    const position = target.at === "end" ? box.value.length : 0;
    box.setSelectionRange(position, position);
  }, [blocks]);

  async function save() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = null;
    const content = serializeJournalPage(latestBlocks.current);
    if (content === savedContent.current) return;
    const isNew = !entryId.current && !creating.current;
    // A new page with nothing on it isn't worth an entry yet.
    if (isNew && (!content || !createAction)) return;

    savedContent.current = content;
    setStatus("saving");
    const formData = new FormData();
    formData.set("content", content);

    let saved: boolean;
    if (isNew) {
      creating.current = createAction!(formData).catch((error) => {
        console.error("Could not start the page", error);
        return null;
      });
      entryId.current = await creating.current;
      if (!entryId.current) creating.current = null;
      saved = Boolean(entryId.current);
      setIsSaved(saved);
    } else {
      const id = entryId.current ?? (await creating.current);
      entryId.current = id;
      if (hasLegacyPrompt.current) formData.set("promptText", "");
      saved = Boolean(id) && (await saveInBackground(() => updateAction(id!, formData)));
      if (saved) hasLegacyPrompt.current = false;
    }
    // After a failure, the next edit (or click away) tries again.
    if (!saved) savedContent.current = null;
    setStatus(saved ? "saved" : "error");
  }

  // Closing the popup (or switching journal) mid-pause still saves.
  const saveBeforeLeaving = useEffectEvent(() => {
    if (saveTimer.current) void save();
  });
  useEffect(() => () => saveBeforeLeaving(), []);

  // Deletes the entry and starts over on a blank page; writing again makes a new one.
  async function deletePage() {
    const id = entryId.current ?? (await creating.current);
    if (!id || !deleteAction || !window.confirm("Delete this page? This can't be undone.")) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = null;
    entryId.current = null;
    creating.current = null;
    hasLegacyPrompt.current = false;
    const blank = withKeys(parseJournalPage(null));
    latestBlocks.current = blank;
    savedContent.current = "";
    setBlocks(blank);
    setIsSaved(false);
    setStatus(null);
    await saveInBackground(() => deleteAction(id));
  }

  function changePage(next: Block[], focus?: { key: number; at: "start" | "end" }) {
    latestBlocks.current = next;
    focusNext.current = focus ?? null;
    setBlocks(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void save(), autosaveDelayMs);
  }

  function editBlock(key: number, text: string) {
    changePage(blocks.map((block) => (block.key === key ? { ...block, text } : block)));
  }

  function pickPrompt(text: string) {
    const [prompt, answer] = withKeys([
      { kind: "prompt", text },
      { kind: "text", text: "" },
    ]);
    // On an empty page the prompt goes first; otherwise it's added at the end.
    const emptyPage = blocks.length === 1 && blocks[0].text.trim() === "";
    changePage(emptyPage ? [prompt, answer] : [...blocks, prompt, answer], { key: answer.key, at: "end" });
  }

  function addRandomPrompt() {
    const onPage = blocks.filter((block) => block.kind === "prompt").map((block) => block.text);
    const prompt = pickPromptToAdd(savedPrompts ?? [], onPage);
    if (prompt) pickPrompt(prompt);
  }

  // Backspace on an emptied prompt line takes the line away, joining the
  // writing around it, and carries on at the end of the writing above.
  function removePrompt(index: number) {
    const before = blocks[index - 1];
    const after = blocks[index + 1];
    if (before?.kind === "text" && after?.kind === "text") {
      const joined = { ...before, text: after.text ? `${before.text}\n${after.text}` : before.text };
      changePage([...blocks.slice(0, index - 1), joined, ...blocks.slice(index + 2)], {
        key: joined.key,
        at: "end",
      });
    } else {
      const neighbour = before ?? after;
      changePage(blocks.toSpliced(index, 1), neighbour && { key: neighbour.key, at: before ? "end" : "start" });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-2xl border border-amber-900/10 bg-white/55 px-4 py-3 shadow-sm">
        {blocks.map((block, index) => {
          const isLast = index === blocks.length - 1;
          const ref = (box: HTMLTextAreaElement | null) => {
            if (box) boxes.current.set(block.key, box);
            else boxes.current.delete(block.key);
          };
          return block.kind === "prompt" ? (
            <textarea
              key={block.key}
              ref={ref}
              rows={1}
              value={block.text}
              aria-label="Prompt"
              placeholder="Prompt"
              onChange={(event) => editBlock(block.key, event.target.value)}
              onBlur={() => void save()}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  // A prompt is one line: Enter goes down to its answer.
                  event.preventDefault();
                  const answer = blocks[index + 1];
                  if (answer) boxes.current.get(answer.key)?.focus();
                } else if (event.key === "Backspace" && event.currentTarget.value === "") {
                  event.preventDefault();
                  removePrompt(index);
                }
              }}
              className={`${BOX_CLASSES} ${index > 0 ? "mt-4" : ""} text-amber-900/80 italic`}
            />
          ) : (
            <textarea
              key={block.key}
              ref={ref}
              value={block.text}
              aria-label="Writing"
              placeholder={blocks.length === 1 ? "Dear journal..." : undefined}
              onChange={(event) => editBlock(block.key, event.target.value)}
              onBlur={() => void save()}
              onKeyDown={(event) => {
                // Backspace at the very start of an answer goes up to its prompt.
                const box = event.currentTarget;
                const atStart = box.selectionStart === 0 && box.selectionEnd === 0;
                const above = blocks[index - 1];
                if (event.key === "Backspace" && atStart && above) {
                  event.preventDefault();
                  const prompt = boxes.current.get(above.key);
                  prompt?.focus();
                  prompt?.setSelectionRange(prompt.value.length, prompt.value.length);
                }
              }}
              // The last part of the page keeps plenty of room to write into.
              className={`${BOX_CLASSES} ${isLast ? (blocks.length === 1 ? "min-h-[45dvh]" : "min-h-[30dvh]") : ""}`}
            />
          );
        })}
      </div>

      <div className="flex h-6 items-center justify-end gap-2 text-xs text-muted-foreground">
        <p aria-live="polite">{status && STATUS_TEXT[status]}</p>
        {deleteAction && isSaved && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Delete this page"
            title="Delete this page"
            onClick={() => void deletePage()}
            className="text-destructive"
          >
            <Trash2 aria-hidden />
          </Button>
        )}
      </div>

      {savedPrompts && addPromptAction && deletePromptAction && (
        <div className="flex items-start gap-1">
          <div className="min-w-0 flex-1">
            <PromptChips
              prompts={savedPrompts}
              onPick={pickPrompt}
              addAction={addPromptAction}
              deleteAction={deletePromptAction}
            />
          </div>
          {savedPrompts.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Add a random prompt"
              title="Add a random prompt"
              onClick={addRandomPrompt}
            >
              <Shuffle aria-hidden />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
