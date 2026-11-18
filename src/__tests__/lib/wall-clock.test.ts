import { describe, expect, it } from "vitest";
import { toWallClockDate } from "@/lib/wall-clock";

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
