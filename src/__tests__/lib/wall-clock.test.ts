import { describe, expect, it } from "vitest";
import { fromWallClockDate, toWallClockDate } from "@/lib/wall-clock";

// Wall-clock dates are written with a Z because that's how the app stores
// them: the UTC fields hold the time shown on the user's clock.
describe("fromWallClockDate", () => {
  it("turns New York's 8:30pm into the real moment, 1:30am UTC the next day", () => {
    const wallClock = new Date("2026-11-18T20:30:00Z");

    const result = fromWallClockDate(wallClock, "America/New_York");

    expect(result.toISOString()).toBe("2026-11-19T01:30:00.000Z");
  });

  it("goes back a day for Tokyo's early morning", () => {
    const wallClock = new Date("2026-11-19T05:00:00Z");

    const result = fromWallClockDate(wallClock, "Asia/Tokyo");

    expect(result.toISOString()).toBe("2026-11-18T20:00:00.000Z");
  });

  it("uses summer time in summer", () => {
    const wallClock = new Date("2026-07-01T08:00:00Z");

    const result = fromWallClockDate(wallClock, "America/New_York");

    expect(result.toISOString()).toBe("2026-07-01T12:00:00.000Z");
  });

  it("leaves the time unchanged in UTC", () => {
    const wallClock = new Date("2026-11-18T00:00:00Z");

    expect(fromWallClockDate(wallClock, "UTC").toISOString()).toBe("2026-11-18T00:00:00.000Z");
  });

  it("undoes toWallClockDate on ordinary days", () => {
    const instant = new Date("2026-03-20T14:45:00Z");

    const roundTrip = fromWallClockDate(toWallClockDate(instant, "Europe/Berlin"), "Europe/Berlin");

    expect(roundTrip.toISOString()).toBe(instant.toISOString());
  });

  it("moves a time skipped by spring-forward ahead by an hour (2:30am → 3:30am)", () => {
    // On 2026-03-08 New York's clocks jump from 2:00am straight to 3:00am.
    const wallClock = new Date("2026-03-08T02:30:00Z");

    const result = fromWallClockDate(wallClock, "America/New_York");

    // 3:30am summer time (UTC-4)
    expect(result.toISOString()).toBe("2026-03-08T07:30:00.000Z");
  });

  it("picks the first of the two 1:30ams when clocks fall back", () => {
    // On 2026-11-01 New York's clocks go from 2:00am back to 1:00am, so
    // 1:30am happens twice: first in summer time (UTC-4), then winter (UTC-5).
    const wallClock = new Date("2026-11-01T01:30:00Z");

    const result = fromWallClockDate(wallClock, "America/New_York");

    expect(result.toISOString()).toBe("2026-11-01T05:30:00.000Z");
  });
});

describe("toWallClockDate", () => {
  it("shifts a UTC instant back to New York's evening of the previous day", () => {
    const instant = new Date("2026-11-19T01:30:00Z");

    const result = toWallClockDate(instant, "America/New_York");

    expect(result.toISOString()).toBe("2026-11-18T20:30:00.000Z");
  });

  it("shifts a UTC instant forward into Tokyo's next morning", () => {
    const instant = new Date("2026-11-18T20:00:00Z");

    const result = toWallClockDate(instant, "Asia/Tokyo");

    expect(result.toISOString()).toBe("2026-11-19T05:00:00.000Z");
  });

  it("follows daylight saving time", () => {
    const instant = new Date("2026-07-01T12:00:00Z");

    const result = toWallClockDate(instant, "America/New_York");

    expect(result.toISOString()).toBe("2026-07-01T08:00:00.000Z");
  });

  it("leaves the time unchanged in UTC, including midnight", () => {
    const instant = new Date("2026-11-18T00:00:00Z");

    const result = toWallClockDate(instant, "UTC");

    expect(result.toISOString()).toBe("2026-11-18T00:00:00.000Z");
  });
});
