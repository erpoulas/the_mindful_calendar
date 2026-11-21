"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { isPendingItem, pendingItemId } from "@/lib/optimistic-list";
import { PostItIconButton, RowActions, ScheduleIconLink } from "./item-actions";
import { saveInBackground, useOptimisticList } from "./use-optimistic-list";

type ChecklistItem = { id: string; text: string; done: boolean };

/**
 * A project's tasks or a quick list's items: tick boxes, Schedule and
 * post-it icons that show when you hover a row, and an add box. Ticking,
 * adding and moving an item to the post-its change the list on screen at
 * once and save in the background. With `editTextAction`, clicking an
 * item's text turns it into a text box, the way post-its work.
 */
export function Checklist({
  listId,
  items,
  emptyText,
  addPlaceholder,
  toggleAction,
  addAction,
  promoteToPostItAction,
  editTextAction,
  scheduleProjectId,
  listClassName,
  formClassName,
}: {
  listId: string;
  items: ChecklistItem[];
  emptyText: string;
  addPlaceholder: string;
  toggleAction: (itemId: string, listId: string) => Promise<void>;
  addAction: (listId: string, formData: FormData) => Promise<void>;
  /** Quick lists only: turns an item into a post-it, taking it off the list. */
  promoteToPostItAction?: (itemId: string) => Promise<void>;
  /** Quick lists only: saves an item's edited text. */
  editTextAction?: (itemId: string, formData: FormData) => Promise<void>;
  /** Projects only: new events scheduled from a task count toward the project. */
  scheduleProjectId?: string;
  listClassName: string;
  formClassName: string;
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
      <ul className={listClassName}>
        {shownItems.length === 0 && <p className="text-sm text-muted-foreground">{emptyText}</p>}
        {shownItems.map((item) => {
          const saved = !isPendingItem(item.id);
          return (
            <li key={item.id} className="group flex items-center gap-2">
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
                  className={`h-5 w-5 rounded border ${
                    item.done ? "border-primary bg-primary" : "border-border bg-background"
                  }`}
                />
              </form>
              {editingId === item.id ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveText(item, new FormData(event.currentTarget));
                  }}
                  className="flex-1"
                >
                  <input
                    name="text"
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
                    className="w-full border-b border-border bg-transparent outline-none"
                  />
                </form>
              ) : editTextAction && saved ? (
                <button
                  type="button"
                  onClick={() => setEditingId(item.id)}
                  className={`flex-1 cursor-text text-left ${
                    item.done ? "text-muted-foreground line-through" : ""
                  }`}
                >
                  {item.text}
                </button>
              ) : (
                <span className={`flex-1 ${item.done ? "text-muted-foreground line-through" : ""}`}>
                  {item.text}
                </span>
              )}
              <RowActions>
                <ScheduleIconLink
                  href={dashboardRoutes.newEvent({ title: item.text, projectId: scheduleProjectId })}
                />
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
            </li>
          );
        })}
      </ul>

      <form ref={addFormRef} action={add} className={formClassName}>
        <Input name="text" placeholder={addPlaceholder} required />
        <Button type="submit">Add</Button>
      </form>
    </>
  );
}
