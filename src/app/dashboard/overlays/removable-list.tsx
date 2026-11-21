"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { isPendingItem, pendingItemId } from "@/lib/optimistic-list";
import { CopyToPostItButton, RowActions, ScheduleIconLink } from "./item-actions";
import { saveInBackground, useOptimisticList } from "./use-optimistic-list";

type TextItem = { id: string; text: string };

/**
 * A plain list of saved lines, each with a "Remove" button, and an add box
 * below: affirmations, the dopamine menu, a journal's prompt pool. Adding and
 * removing change the list on screen at once and save in the background.
 * With `createPostItAction`, each row also gets Schedule and post-it icons.
 */
export function RemovableList({
  items,
  emptyText,
  addPlaceholder,
  addLabel,
  removeAction,
  addAction,
  listClassName,
  createPostItAction,
}: {
  items: TextItem[];
  emptyText: string;
  addPlaceholder: string;
  addLabel: string;
  removeAction: (itemId: string) => Promise<void>;
  addAction: (formData: FormData) => Promise<void>;
  listClassName: string;
  /** Dopamine menu only: lets a row become an event or a post-it. */
  createPostItAction?: (formData: FormData) => Promise<void>;
}) {
  const [shownItems, changeList] = useOptimisticList(items);
  const addFormRef = useRef<HTMLFormElement>(null);

  async function add(formData: FormData) {
    const text = String(formData.get("text") ?? "").trim();
    if (!text) return;
    changeList({ type: "add", item: { id: pendingItemId(), text } });
    addFormRef.current?.reset();
    await saveInBackground(() => addAction(formData));
  }

  return (
    <>
      <ul className={listClassName}>
        {shownItems.length === 0 && <p className="text-sm text-muted-foreground">{emptyText}</p>}
        {shownItems.map((item) => (
          <li key={item.id} className="group flex items-center justify-between gap-2 text-sm">
            <span className={createPostItAction ? "flex-1" : undefined}>{item.text}</span>
            {createPostItAction && (
              <RowActions>
                <ScheduleIconLink href={dashboardRoutes.newEvent({ title: item.text })} />
                <CopyToPostItButton text={item.text} createPostItAction={createPostItAction} />
              </RowActions>
            )}
            <form
              action={async () => {
                changeList({ type: "remove", id: item.id });
                await saveInBackground(() => removeAction(item.id));
              }}
            >
              <Button type="submit" variant="ghost" size="sm" disabled={isPendingItem(item.id)}>
                Remove
              </Button>
            </form>
          </li>
        ))}
      </ul>

      <form ref={addFormRef} action={add} className="mt-3 flex gap-2">
        <Input name="text" placeholder={addPlaceholder} required />
        <Button type="submit">{addLabel}</Button>
      </form>
    </>
  );
}
