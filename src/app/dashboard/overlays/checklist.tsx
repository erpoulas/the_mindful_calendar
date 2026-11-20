"use client";

import Link from "next/link";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { isPendingItem, pendingItemId } from "@/lib/optimistic-list";
import { saveInBackground, useOptimisticList } from "./use-optimistic-list";

type ChecklistItem = { id: string; text: string; done: boolean };

/**
 * A project's tasks or a quick list's items: tick boxes, a "Schedule" link,
 * and an add box. Ticking, adding and "→ Post-it" change the list on screen
 * at once and save in the background.
 */
export function Checklist({
  listId,
  items,
  emptyText,
  addPlaceholder,
  toggleAction,
  addAction,
  promoteToPostItAction,
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
  /** Projects only: new events scheduled from a task count toward the project. */
  scheduleProjectId?: string;
  listClassName: string;
  formClassName: string;
}) {
  const [shownItems, changeList] = useOptimisticList(items);
  const addFormRef = useRef<HTMLFormElement>(null);

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
            <li key={item.id} className="flex items-center gap-2">
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
              <span className={`flex-1 ${item.done ? "text-muted-foreground line-through" : ""}`}>
                {item.text}
              </span>
              <Link
                href={dashboardRoutes.newEvent({ title: item.text, projectId: scheduleProjectId })}
                className="text-sm text-muted-foreground underline"
              >
                Schedule
              </Link>
              {promoteToPostItAction && saved && (
                <form
                  action={async () => {
                    changeList({ type: "remove", id: item.id });
                    await saveInBackground(() => promoteToPostItAction(item.id));
                  }}
                >
                  <button type="submit" className="text-sm text-muted-foreground underline">
                    → Post-it
                  </button>
                </form>
              )}
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
