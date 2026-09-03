import { describe, expect, it } from "vitest";
import { getWeekRange } from "./calendar-week";

describe("getWeekRange", () => {
  it("returns the Monday-to-next-Monday range for a mid-week date", () => {
    const { start, end } = getWeekRange(new Date("2026-09-09T15:30:00Z")); // Wednesday

    expect(start).toEqual(new Date("2026-09-07T00:00:00Z")); // Monday
    expect(end).toEqual(new Date("2026-09-14T00:00:00Z")); // next Monday
  });

  it("treats a Monday reference date as the start of its own week", () => {
    const { start, end } = getWeekRange(new Date("2026-09-07T09:00:00Z"));

    expect(start).toEqual(new Date("2026-09-07T00:00:00Z"));
    expect(end).toEqual(new Date("2026-09-14T00:00:00Z"));
  });

  it("treats a Sunday reference date as the end of the prior week", () => {
    const { start, end } = getWeekRange(new Date("2026-09-13T09:00:00Z"));

    expect(start).toEqual(new Date("2026-09-07T00:00:00Z"));
    expect(end).toEqual(new Date("2026-09-14T00:00:00Z"));
  });
});
