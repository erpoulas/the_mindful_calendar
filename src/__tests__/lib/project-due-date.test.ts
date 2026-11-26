import { describe, expect, it } from "vitest";
import { dueDateFromInput, dueDateInputValue, formatDueDate } from "@/lib/project-due-date";

describe("project due dates", () => {
  it("shows the stored day itself, whatever the viewer's time zone", () => {
    // Saved from <input type="date"> as midnight UTC: in New York that
    // moment is still Oct 11, but the project is due on the 12th.
    expect(formatDueDate(new Date("2026-10-12T00:00:00Z"))).toBe("Mon, Oct 12, 2026");
  });

  it("round-trips through a date box's value", () => {
    const date = dueDateFromInput("2026-10-12");
    expect(date).toEqual(new Date("2026-10-12T00:00:00Z"));
    expect(dueDateInputValue(date!)).toBe("2026-10-12");
  });

  it("treats an empty or broken box as no due date", () => {
    expect(dueDateFromInput("")).toBeNull();
    expect(dueDateFromInput("  ")).toBeNull();
    expect(dueDateFromInput("not a date")).toBeNull();
  });
});
