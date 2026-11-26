"use client";

import { Dices, Tag } from "lucide-react";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { Checklist } from "./checklist";
import type { IntentionChoice } from "./intention-chips";
import { CopyToPostItButton, iconButtonClass } from "./item-actions";
import { saveInBackground } from "./use-optimistic-list";

type MenuItem = { id: string; text: string; done: boolean; intentionId: string | null };

/**
 * The dopamine menu's items on the ruled paper, edited like a quick list
 * (click to edit, backspace away to delete, type on the blank line to add).
 * Nothing gets ticked off, since menu items are meant to be reused: each
 * row's bullet is instead a dot in its intention's color (hollow when it has
 * none), and the hover icons add "make a post-it" (keeping the item) and an
 * intention picker. Schedule and Start now make events that count toward the
 * item's intention.
 */
export function DopamineMenuList({
  items,
  intentions,
  addAction,
  editTextAction,
  deleteAction,
  startNowAction,
  createPostItAction,
  setIntentionAction,
}: {
  items: { id: string; text: string; intentionId: string | null }[];
  intentions: IntentionChoice[];
  addAction: (formData: FormData) => Promise<void>;
  editTextAction: (itemId: string, formData: FormData) => Promise<void>;
  deleteAction: (itemId: string) => Promise<void>;
  startNowAction: (itemId: string) => Promise<void>;
  createPostItAction: (formData: FormData) => Promise<void>;
  /** Saves an item's intention; "" clears it. */
  setIntentionAction: (itemId: string, intentionId: string) => Promise<void>;
}) {
  const intentionById = new Map(intentions.map((intention) => [intention.id, intention]));

  return (
    <Checklist<MenuItem>
      listId="dopamine-menu"
      items={items.map((item) => ({ ...item, done: false }))}
      addPlaceholder="Something that lifts you up"
      addAction={(_listId, formData) => addAction(formData)}
      editTextAction={editTextAction}
      deleteAction={deleteAction}
      startNowAction={startNowAction}
      // An empty menu is ready to type into.
      focusNewItem={items.length === 0}
      scheduleHref={(item) =>
        dashboardRoutes.newEvent({ title: item.text, intentionId: item.intentionId ?? undefined })
      }
      renderBullet={(item) => (
        <IntentionDot intention={item.intentionId ? intentionById.get(item.intentionId) : undefined} />
      )}
      renderExtraActions={(item) => (
        <>
          <CopyToPostItButton text={item.text} createPostItAction={createPostItAction} />
          <IntentionPicker item={item} intentions={intentions} setIntentionAction={setIntentionAction} />
        </>
      )}
    />
  );
}

/** A dot in the intention's color, or a hollow ring for an untagged item. */
function IntentionDot({ intention }: { intention?: IntentionChoice }) {
  if (!intention) {
    return <span aria-hidden className="mx-1 size-3 rounded-full border-2 border-muted-foreground/40" />;
  }
  return (
    <span
      role="img"
      aria-label={`Counts toward ${intention.name}`}
      title={`Counts toward ${intention.name}`}
      className="mx-1 size-3 rounded-full"
      style={{ backgroundColor: intention.colorHex ?? "var(--color-primary)" }}
    />
  );
}

/**
 * A tag icon that opens the browser's own list of intentions: the select
 * sits invisibly over the icon, so it looks like the other row icons but
 * still works with the keyboard and screen readers.
 */
function IntentionPicker({
  item,
  intentions,
  setIntentionAction,
}: {
  item: MenuItem;
  intentions: IntentionChoice[];
  setIntentionAction: (itemId: string, intentionId: string) => Promise<void>;
}) {
  return (
    <span className={`relative ${iconButtonClass}`} title="Intention">
      <Tag className="size-4" aria-hidden />
      <select
        aria-label={`Intention for ${item.text}`}
        defaultValue={item.intentionId ?? ""}
        onChange={(event) => {
          const intentionId = event.target.value;
          void saveInBackground(() => setIntentionAction(item.id, intentionId));
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        <option value="">No intention</option>
        {intentions.map((intention) => (
          <option key={intention.id} value={intention.id}>
            {intention.name}
          </option>
        ))}
      </select>
    </span>
  );
}

/** Rolls the dice: shows a different random pick. */
export function RollAgainButton({ rollAction }: { rollAction: () => Promise<void> }) {
  return (
    <form action={rollAction}>
      <button type="submit" aria-label="Pick something else" title="Pick something else" className={iconButtonClass}>
        <Dices className="size-4" aria-hidden />
      </button>
    </form>
  );
}
