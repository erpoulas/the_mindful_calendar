// What a list on screen looks like right after a click, before the server
// has answered: a ticked box, a new line, a removed line. The popups show
// this at once (React's useOptimistic) and the server's real list replaces
// it when the save finishes; if the save fails, the change simply undoes.

export type ListChange<Item> =
  | { type: "toggle"; id: string }
  | { type: "add"; item: Item }
  | { type: "remove"; id: string };

export function applyListChange<Item extends { id: string; done?: boolean }>(
  items: Item[],
  change: ListChange<Item>,
): Item[] {
  switch (change.type) {
    case "toggle":
      return items.map((item) => (item.id === change.id ? { ...item, done: !item.done } : item));
    case "add":
      return [...items, change.item];
    case "remove":
      return items.filter((item) => item.id !== change.id);
  }
}

const PENDING_PREFIX = "pending-";

/** A temporary id for an item shown before the server has saved it. */
export function pendingItemId() {
  return `${PENDING_PREFIX}${crypto.randomUUID()}`;
}

/** True for an item that isn't saved yet, so it can't be ticked or removed. */
export function isPendingItem(id: string) {
  return id.startsWith(PENDING_PREFIX);
}
