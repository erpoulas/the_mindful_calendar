"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { isPendingItem, pendingItemId } from "@/lib/optimistic-list";
import { CopyToPostItButton, RowActions, ScheduleIconLink, StartNowButton } from "./item-actions";
import { saveInBackground, useOptimisticList } from "./use-optimistic-list";

type TextItem = { id: string; text: string; intentionId?: string | null };

type IntentionTags = {
  intentions: { id: string; name: string }[];
  /** Saves a row's intention; "" clears it. */
  setIntentionAction: (itemId: string, intentionId: string) => Promise<void>;
};

/**
 * A plain list of saved lines, each with a "Remove" button, and an add box
 * below: affirmations, the dopamine menu, a journal's prompt pool. Adding and
 * removing change the list on screen at once and save in the background.
 * With `createPostItAction`, each row also gets Schedule and post-it icons.
 * With `intentionTags`, each row gets an intention picker, and scheduling the
 * row makes an event that counts toward that intention.
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
  startNowAction,
  intentionTags,
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
  /** Dopamine menu only: makes a 1-hour event from the row, starting now. */
  startNowAction?: (itemId: string) => Promise<void>;
  /** Dopamine menu only: tag each row with an intention. */
  intentionTags?: IntentionTags;
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
                <ScheduleIconLink
                  href={dashboardRoutes.newEvent({
                    title: item.text,
                    intentionId: item.intentionId ?? undefined,
                  })}
                />
                {startNowAction && !isPendingItem(item.id) && (
                  <StartNowButton itemId={item.id} startNowAction={startNowAction} />
                )}
                <CopyToPostItButton text={item.text} createPostItAction={createPostItAction} />
              </RowActions>
            )}
            {intentionTags && !isPendingItem(item.id) && (
              <IntentionPicker item={item} intentionTags={intentionTags} />
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

/**
 * A small dropdown on the row. It saves as soon as an intention is picked;
 * the list then reloads with the new tag.
 */
function IntentionPicker({ item, intentionTags }: { item: TextItem; intentionTags: IntentionTags }) {
  return (
    <select
      aria-label={`Intention for ${item.text}`}
      title="Events made from this count toward this intention"
      defaultValue={item.intentionId ?? ""}
      onChange={(event) => {
        const intentionId = event.target.value;
        void saveInBackground(() => intentionTags.setIntentionAction(item.id, intentionId));
      }}
      className="h-7 max-w-32 shrink-0 rounded-md border border-input bg-transparent px-1.5 text-xs text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <option value="">No intention</option>
      {intentionTags.intentions.map((intention) => (
        <option key={intention.id} value={intention.id}>
          {intention.name}
        </option>
      ))}
    </select>
  );
}
