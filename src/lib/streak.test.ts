import { describe, expect, it } from "vitest";
import { getWeeklyEventCounts } from "./streak";

describe("getWeeklyEventCounts", () => {
  const reference = new Date("2026-08-13T12:00:00Z");

  it("returns all zeros when there are no events", () => {
    expect(getWeeklyEventCounts([], reference)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it("counts an event on the reference date in the last bucket", () => {
    const result = getWeeklyEventCounts([reference], reference);
    expect(result).toEqual([0, 0, 0, 0, 0, 0, 0, 1]);
  });

  it("counts an event from exactly one week ago in the second-to-last bucket", () => {
    const oneWeekAgo = new Date(reference.getTime() - 7 * 24 * 60 * 60 * 1000);
    const result = getWeeklyEventCounts([oneWeekAgo], reference);
    expect(result).toEqual([0, 0, 0, 0, 0, 0, 1, 0]);
  });

  it("groups multiple events in the same week into one bucket", () => {
    const sameWeek1 = new Date(reference.getTime() - 1 * 24 * 60 * 60 * 1000);
    const sameWeek2 = new Date(reference.getTime() - 2 * 24 * 60 * 60 * 1000);
    const result = getWeeklyEventCounts([sameWeek1, sameWeek2], reference);
    expect(result).toEqual([0, 0, 0, 0, 0, 0, 0, 2]);
  });

  it("excludes events older than the requested window", () => {
    const nineWeeksAgo = new Date(reference.getTime() - 9 * 7 * 24 * 60 * 60 * 1000);
    const result = getWeeklyEventCounts([nineWeeksAgo], reference);
    expect(result).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it("excludes events in the future relative to the reference date", () => {
    const tomorrow = new Date(reference.getTime() + 24 * 60 * 60 * 1000);
    const result = getWeeklyEventCounts([tomorrow], reference);
    expect(result).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it("supports a custom week count", () => {
    const result = getWeeklyEventCounts([reference], reference, 4);
    expect(result).toEqual([0, 0, 0, 1]);
  });
});
