import { describe, expect, it } from "vitest";
import { applyEventMoves, sortByOrder } from "@/lib/dropped-positions";

describe("applyEventMoves", () => {
  const nine = new Date("2026-11-19T09:00:00Z");
  const ten = new Date("2026-11-19T10:00:00Z");
  const events = [
    { id: "a", title: "A", startAt: nine, endAt: ten },
    { id: "b", title: "B", startAt: nine, endAt: null },
  ];

  it("moves only the events that were dropped", () => {
    const newStart = new Date("2026-11-20T14:00:00Z");
    const newEnd = new Date("2026-11-20T15:00:00Z");

    const moved = applyEventMoves(events, { a: { startAt: newStart, endAt: newEnd } });

    expect(moved[0]).toEqual({ id: "a", title: "A", startAt: newStart, endAt: newEnd });
    expect(moved[1]).toBe(events[1]);
  });

  it("returns the events unchanged when nothing was dropped", () => {
    expect(applyEventMoves(events, {})).toEqual(events);
  });
});

describe("sortByOrder", () => {
  const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const idOf = (item: { id: string }) => item.id;

  it("puts items in the given order", () => {
    expect(sortByOrder(items, ["c", "a", "b"], idOf).map(idOf)).toEqual(["c", "a", "b"]);
  });

  it("keeps the original order when there is no new order", () => {
    expect(sortByOrder(items, null, idOf)).toBe(items);
  });

  it("keeps items the order doesn't mention, after the ordered ones", () => {
    expect(sortByOrder(items, ["b"], idOf).map(idOf)).toEqual(["b", "a", "c"]);
  });
});
