"use client";

import { useRef, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { isPendingItem, pendingItemId } from "@/lib/optimistic-list";
import { PostItIconButton, RowActions, ScheduleIconLink, StartNowButton } from "./item-actions";
import { saveInBackground, useOptimisticList } from "./use-optimistic-list";

type ChecklistItem = { id: string; text: string; done: boolean };

// One row per ruled line. A popup whose paper art has ruled lines sets
// --paper-line to their spacing (see PanelArt's ruledLines), so each line of
// an item's text lands on a line of the paper; elsewhere rows are 2.25rem.
// The text is the same for an item, its edit box and the blank line.
const ITEM_TEXT_CLASSES = "text-[15px] leading-[var(--paper-line,2.25rem)]";
// Holds a tick circle in the middle of an item's first line.
const CIRCLE_SLOT_CLASSES = "flex h-[var(--paper-line,2.25rem)] shrink-0 items-center";

/**
 * A project's tasks or a quick list's items, laid out like Apple Reminders:
 * round tick circles, Schedule and post-it icons that show when you hover a
 * row, and a blank line at the bottom where you type a new item and press
 * Enter (the line empties, ready for the next one). Ticking, adding and
 * moving an item to the post-its change the list on screen at once and save
 * in the background. With `editTextAction`, clicking an item's text turns it
 * into a text box that grows with what you type; with `deleteAction`,
 * backspacing all its text away deletes the item.
 */
export function Checklist({
  listId,
  items,
  addPlaceholder,
  toggleAction,
  addAction,
  promoteToPostItAction,
  editTextAction,
  deleteAction,
  startNowAction,
  scheduleProjectId,
}: {
  listId: string;
  items: ChecklistItem[];
  /** The blank line's hint and label, e.g. "New item". */
  addPlaceholder: string;
  toggleAction: (itemId: string, listId: string) => Promise<void>;
  addAction: (listId: string, formData: FormData) => Promise<void>;
  /** Quick lists only: turns an item into a post-it, taking it off the list. */
  promoteToPostItAction?: (itemId: string) => Promise<void>;
  /** Makes a 1-hour event from the item, starting now. */
  startNowAction?: (itemId: string) => Promise<void>;
  /** Quick lists only: saves an item's edited text. */
  editTextAction?: (itemId: string, formData: FormData) => Promise<void>;
  /** Quick lists only: deletes an item whose text was cleared away. */
  deleteAction?: (itemId: string) => Promise<void>;
  /** Projects only: new events scheduled from a task count toward the project. */
  scheduleProjectId?: string;
}) {
  const [shownItems, changeList] = useOptimisticList(items);
  const addFormRef = useRef<HTMLFormElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function saveText(item: ChecklistItem, formData: FormData) {
    setEditingId(null);
    const text = String(formData.get("text") ?? "").trim();
    // Clearing the text deletes the item, like Reminders. Without a way to
    // delete (or left unchanged), the box just closes.
    if (!text && deleteAction) {
      startTransition(async () => {
        changeList({ type: "remove", id: item.id });
        await saveInBackground(() => deleteAction(item.id));
      });
      return;
    }
    if (!editTextAction || !text || text === item.text) return;
    startTransition(async () => {
      changeList({ type: "rename", id: item.id, text });
      await saveInBackground(() => editTextAction(item.id, formData));
    });
  }

  async function add(formData: FormData) {
    const text = String(formData.get("text") ?? "").trim();
    if (!text) return;
    changeList({ type: "add", item: { id: pendingItemId(), text, done: false } });
    addFormRef.current?.reset();
    await saveInBackground(() => addAction(listId, formData));
  }

  return (
    <>
      {/* No divider lines: the popups' paper art already has its own. The
          small nudge down sets the text on the ruled line rather than
          floating in the middle of the gap between two lines. */}
      <ul className="relative top-[calc(var(--paper-line,2.25rem)/2-0.6em)] flex flex-col text-[15px]">
        {shownItems.map((item) => {
          const saved = !isPendingItem(item.id);
          return (
            <li key={item.id} className="group relative flex items-start gap-3">
              <form
                className={CIRCLE_SLOT_CLASSES}
                action={async () => {
                  changeList({ type: "toggle", id: item.id });
                  await saveInBackground(() => toggleAction(item.id, listId));
                }}
              >
                <button
                  type="submit"
                  disabled={!saved}
                  aria-label={item.done ? "Mark not done" : "Mark done"}
                  className={`flex size-5 items-center justify-center rounded-full border-2 transition ${
                    item.done
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40 hover:border-primary"
                  }`}
                >
                  {item.done && <Check className="size-3" strokeWidth={3} aria-hidden />}
                </button>
              </form>
              {editingId === item.id ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveText(item, new FormData(event.currentTarget));
                  }}
                  className="flex-1"
                >
                  <textarea
                    name="text"
                    rows={1}
                    autoFocus
                    defaultValue={item.text}
                    aria-label="Item text"
                    onFocus={(event) => event.currentTarget.select()}
                    // Leaving the box saves; Enter saves, Escape throws the edit away.
                    onBlur={(event) => event.currentTarget.form?.requestSubmit()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        event.currentTarget.blur();
                      } else if (event.key === "Backspace" && event.currentTarget.value === "") {
                        // One more Backspace on an empty box deletes the item.
                        event.preventDefault();
                        event.currentTarget.blur();
                      } else if (event.key === "Escape") {
                        // Keep Escape from also closing the popup.
                        event.stopPropagation();
                        event.currentTarget.value = item.text;
                        event.currentTarget.blur();
                      }
                    }}
                    className={`${ITEM_TEXT_CLASSES} field-sizing-content block w-full resize-none rounded-sm bg-primary/5 outline-none`}
                  />
                </form>
              ) : editTextAction && saved ? (
                <button
                  type="button"
                  onClick={() => setEditingId(item.id)}
                  className={`${ITEM_TEXT_CLASSES} flex-1 cursor-text text-left ${
                    item.done ? "text-muted-foreground line-through" : ""
                  }`}
                >
                  {item.text}
                </button>
              ) : (
                <span
                  className={`${ITEM_TEXT_CLASSES} flex-1 ${item.done ? "text-muted-foreground line-through" : ""}`}
                >
                  {item.text}
                </span>
              )}
              {/* With a mouse, the icons float over the end of the row on
                  hover, so the text gets the full width; touch screens
                  (no hover) keep them beside the text. They're hidden while
                  the item is being edited, so they don't cover its text. */}
              {editingId !== item.id && (
                <RowActions className="absolute top-[calc((var(--paper-line,2.25rem)-1.75rem)/2)] right-0 rounded-lg bg-white/95 px-0.5 shadow-sm [@media(hover:none)]:static [@media(hover:none)]:bg-transparent [@media(hover:none)]:shadow-none">
                  <ScheduleIconLink
                    href={dashboardRoutes.newEvent({ title: item.text, projectId: scheduleProjectId })}
                  />
                  {startNowAction && saved && (
                    <StartNowButton itemId={item.id} startNowAction={startNowAction} />
                  )}
                  {promoteToPostItAction && saved && (
                    <form
                      action={async () => {
                        changeList({ type: "remove", id: item.id });
                        await saveInBackground(() => promoteToPostItAction(item.id));
                      }}
                    >
                      <PostItIconButton label="Move to post-its" />
                    </form>
                  )}
                </RowActions>
              )}
            </li>
          );
        })}
        {/* The blank line: type and press Enter to add. The box keeps focus
            and empties, so you can type the next item straight away. */}
        <li className="flex items-start gap-3">
          <span className={CIRCLE_SLOT_CLASSES}>
            <span
              aria-hidden
              className="size-5 rounded-full border-2 border-dashed border-muted-foreground/30"
            />
          </span>
          <form ref={addFormRef} action={add} className="flex-1">
            <input
              name="text"
              placeholder={addPlaceholder}
              aria-label={addPlaceholder}
              autoComplete="off"
              className={`${ITEM_TEXT_CLASSES} block h-[var(--paper-line,2.25rem)] w-full bg-transparent outline-none placeholder:text-muted-foreground/70`}
            />
          </form>
        </li>
      </ul>
    </>
  );
}
