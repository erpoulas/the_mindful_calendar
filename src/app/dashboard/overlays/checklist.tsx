"use client";

import { useRef, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { isPendingItem, pendingItemId } from "@/lib/optimistic-list";
import { PostItIconButton, RowActions, ScheduleIconLink, StartNowButton } from "./item-actions";
import { saveInBackground, useOptimisticList } from "./use-optimistic-list";

type ChecklistItem = { id: string; text: string; done: boolean };

// Roomy, easy-to-read text, the same for an item, its edit box and the blank line.
const ITEM_TEXT_CLASSES = "text-[15px] leading-snug";

/**
 * A project's tasks or a quick list's items, laid out like Apple Reminders:
 * round tick circles, Schedule and post-it icons that show when you hover a
 * row, and a blank line at the bottom where you type a new item and press
 * Enter (the line empties, ready for the next one). Ticking, adding and
 * moving an item to the post-its change the list on screen at once and save
 * in the background. With `editTextAction`, clicking an item's text turns it
 * into a text box that grows with what you type.
 */
export function Checklist({
  listId,
  items,
  addPlaceholder,
  toggleAction,
  addAction,
  promoteToPostItAction,
  editTextAction,
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
    // Clearing the text or leaving it unchanged just closes the box.
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
      {/* No divider lines: the popups' paper art already has its own. */}
      <ul className="flex flex-col">
        {shownItems.map((item) => {
          const saved = !isPendingItem(item.id);
          return (
            <li key={item.id} className="group relative flex items-start gap-3 py-2">
              <form
                action={async () => {
                  changeList({ type: "toggle", id: item.id });
                  await saveInBackground(() => toggleAction(item.id, listId));
                }}
              >
                <button
                  type="submit"
                  disabled={!saved}
                  aria-label={item.done ? "Mark not done" : "Mark done"}
                  className={`mt-0.5 flex size-5 items-center justify-center rounded-full border-2 transition ${
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
                      } else if (event.key === "Escape") {
                        // Keep Escape from also closing the popup.
                        event.stopPropagation();
                        event.currentTarget.value = item.text;
                        event.currentTarget.blur();
                      }
                    }}
                    className={`${ITEM_TEXT_CLASSES} field-sizing-content w-full resize-none border-b border-primary/50 bg-transparent outline-none`}
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
                <RowActions className="absolute top-1.5 right-0 rounded-lg bg-white/95 px-0.5 shadow-sm [@media(hover:none)]:static [@media(hover:none)]:bg-transparent [@media(hover:none)]:shadow-none">
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
        <li className="flex items-start gap-3 py-2">
          <span
            aria-hidden
            className="mt-0.5 size-5 shrink-0 rounded-full border-2 border-dashed border-muted-foreground/30"
          />
          <form ref={addFormRef} action={add} className="flex-1">
            <input
              name="text"
              placeholder={addPlaceholder}
              aria-label={addPlaceholder}
              autoComplete="off"
              className={`${ITEM_TEXT_CLASSES} w-full bg-transparent outline-none placeholder:text-muted-foreground/70`}
            />
          </form>
        </li>
      </ul>
    </>
  );
}
