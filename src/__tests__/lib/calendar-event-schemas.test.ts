import { describe, expect, it } from "vitest";
import { CreateCalendarEventSchema } from "@/lib/calendar-event-schemas";

const validEvent = { title: "Call", startAt: "2026-11-15T09:00:00Z" };

describe("CreateCalendarEventSchema time zone", () => {
  it("accepts a known time zone", () => {
    const result = CreateCalendarEventSchema.parse({ ...validEvent, timeZone: "Asia/Tokyo" });
    expect(result.timeZone).toBe("Asia/Tokyo");
  });

  it("allows leaving the time zone out", () => {
    const result = CreateCalendarEventSchema.parse(validEvent);
    expect(result.timeZone).toBeUndefined();
  });

  it("rejects an unknown time zone", () => {
    const result = CreateCalendarEventSchema.safeParse({ ...validEvent, timeZone: "Mars/Olympus" });
    expect(result.success).toBe(false);
  });
});
