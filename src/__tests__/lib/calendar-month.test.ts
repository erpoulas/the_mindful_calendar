import { describe, expect, it } from "vitest";
import { fitEventCount, getMonthGrid } from "@/lib/calendar-month";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

describe("getMonthGrid", () => {
  it("returns the calendar-month boundaries", () => {
    const grid = getMonthGrid(new Date("2026-09-15T12:00:00Z"));

    expect(grid.monthStart).toEqual(new Date("2026-09-01T00:00:00Z"));
    expect(grid.monthEnd).toEqual(new Date("2026-10-01T00:00:00Z"));
  });

  it("handles a reference date that rolls over into a new year", () => {
    const grid = getMonthGrid(new Date("2026-12-25T00:00:00Z"));

    expect(grid.monthStart).toEqual(new Date("2026-12-01T00:00:00Z"));
    expect(grid.monthEnd).toEqual(new Date("2027-01-01T00:00:00Z"));
  });

  it("spans full Monday-aligned weeks covering the entire month", () => {
    const grid = getMonthGrid(new Date("2026-09-15T12:00:00Z"));

    expect(grid.gridStart.getUTCDay()).toBe(1); // Monday
    expect(grid.gridEnd.getUTCDay()).toBe(1); // Monday
    expect(grid.gridStart.getTime()).toBeLessThanOrEqual(grid.monthStart.getTime());
    expect(grid.gridEnd.getTime()).toBeGreaterThanOrEqual(grid.monthEnd.getTime());

    const totalDays = (grid.gridEnd.getTime() - grid.gridStart.getTime()) / MS_PER_DAY;
    expect(totalDays % 7).toBe(0);
  });

  it("doesn't add an extra week when the month already starts and ends on a Monday-aligned boundary", () => {
    // A reference date whose month grid needs no padding on either side.
    const grid = getMonthGrid(new Date("2026-06-15T12:00:00Z"));

    const totalDays = (grid.gridEnd.getTime() - grid.gridStart.getTime()) / MS_PER_DAY;
    expect(totalDays).toBeGreaterThanOrEqual(28);
    expect(totalDays).toBeLessThanOrEqual(42);
  });
});

describe("fitEventCount", () => {
  // Each event line is 20px tall with 4px above it.
  const line = { lineHeight: 20, gap: 4 };

  it("shows every event when they all fit", () => {
    expect(fitEventCount({ ...line, availableHeight: 72, eventCount: 3 })).toBe(3);
  });

  it("keeps the last line free for \"+N more\" when they don't", () => {
    // Room for 3 lines: 2 events, then "+3 more".
    expect(fitEventCount({ ...line, availableHeight: 72, eventCount: 5 })).toBe(2);
  });

  it("never squeezes in part of a line", () => {
    // 71px is just short of 3 lines, so 3 events become 1 plus "+2 more".
    expect(fitEventCount({ ...line, availableHeight: 71, eventCount: 3 })).toBe(1);
  });

  it("shows none when there's no room at all", () => {
    expect(fitEventCount({ ...line, availableHeight: 10, eventCount: 4 })).toBe(0);
    expect(fitEventCount({ ...line, availableHeight: 200, eventCount: 0 })).toBe(0);
  });
});
