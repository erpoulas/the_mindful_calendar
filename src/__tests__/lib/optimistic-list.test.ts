import { describe, expect, it } from "vitest";
import { applyListChange, isPendingItem, pendingItemId } from "@/lib/optimistic-list";

const items = [
  { id: "a", text: "Buy milk", done: false },
  { id: "b", text: "Call mom", done: true },
];

describe("applyListChange", () => {
  it("ticks or unticks only the clicked item", () => {
    const changed = applyListChange(items, { type: "toggle", id: "a" });

    expect(changed[0].done).toBe(true);
    expect(changed[1]).toBe(items[1]);
    expect(applyListChange(items, { type: "toggle", id: "b" })[1].done).toBe(false);
  });

  it("adds a new item at the end", () => {
    const added = { id: pendingItemId(), text: "Walk", done: false };

    expect(applyListChange(items, { type: "add", item: added })).toEqual([...items, added]);
  });

  it("removes the item", () => {
    expect(applyListChange(items, { type: "remove", id: "a" })).toEqual([items[1]]);
  });

  it("changes the text of only the edited item", () => {
    const changed = applyListChange(items, { type: "rename", id: "a", text: "Buy oat milk" });

    expect(changed[0]).toEqual({ id: "a", text: "Buy oat milk", done: false });
    expect(changed[1]).toBe(items[1]);
  });

  it("leaves the list alone when the item isn't there", () => {
    expect(applyListChange(items, { type: "toggle", id: "missing" })).toEqual(items);
    expect(applyListChange(items, { type: "remove", id: "missing" })).toEqual(items);
  });
});

describe("pending items", () => {
  it("gives each added item its own temporary id, marked as not saved yet", () => {
    const first = pendingItemId();
    const second = pendingItemId();

    expect(first).not.toBe(second);
    expect(isPendingItem(first)).toBe(true);
    expect(isPendingItem("a")).toBe(false);
  });
});
