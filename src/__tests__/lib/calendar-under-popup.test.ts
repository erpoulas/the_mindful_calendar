import { describe, expect, it } from "vitest";
import { shouldDrawCalendarUnderPopup } from "@/lib/calendar-under-popup";

describe("shouldDrawCalendarUnderPopup", () => {
  it("draws the calendar on a full page load", () => {
    expect(shouldDrawCalendarUnderPopup(new Headers({ "sec-fetch-dest": "document" }))).toBe(true);
  });

  it("draws the calendar when the browser doesn't say what the request is for", () => {
    expect(shouldDrawCalendarUnderPopup(new Headers())).toBe(true);
  });

  it("skips the calendar when a click inside the app opens a popup", () => {
    expect(shouldDrawCalendarUnderPopup(new Headers({ "sec-fetch-dest": "empty" }))).toBe(false);
  });

  it("draws the calendar for a save, whose answer replaces a calendar drawn by a full load", () => {
    const save = new Headers({ "sec-fetch-dest": "empty", "next-action": "40cdcad70f36" });
    expect(shouldDrawCalendarUnderPopup(save)).toBe(true);
  });
});
