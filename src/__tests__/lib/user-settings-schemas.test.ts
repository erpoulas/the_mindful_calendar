import { describe, expect, it } from "vitest";
import { UpdateCalendarDisplaySchema } from "@/lib/user-settings-schemas";

describe("UpdateCalendarDisplaySchema", () => {
  it("accepts known zones and turns the clock choice into a boolean", () => {
    const result = UpdateCalendarDisplaySchema.parse({
      extraTimezones: ["America/Chicago"],
      clockFormat: "24",
    });

    expect(result).toEqual({ extraTimezones: ["America/Chicago"], use24HourClock: true });
  });

  it("treats the 12-hour choice as false", () => {
    const result = UpdateCalendarDisplaySchema.parse({ extraTimezones: [], clockFormat: "12" });
    expect(result.use24HourClock).toBe(false);
  });

  it("drops repeated zones", () => {
    const result = UpdateCalendarDisplaySchema.parse({
      extraTimezones: ["Asia/Tokyo", "Asia/Tokyo"],
      clockFormat: "12",
    });
    expect(result.extraTimezones).toEqual(["Asia/Tokyo"]);
  });

  it("rejects an unknown zone", () => {
    const result = UpdateCalendarDisplaySchema.safeParse({
      extraTimezones: ["Mars/Olympus"],
      clockFormat: "12",
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than three extra zones", () => {
    const result = UpdateCalendarDisplaySchema.safeParse({
      extraTimezones: ["Asia/Tokyo", "Europe/London", "America/Chicago", "Australia/Sydney"],
      clockFormat: "12",
    });
    expect(result.success).toBe(false);
  });
});
