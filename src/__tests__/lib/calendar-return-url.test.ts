import { describe, expect, it } from "vitest";
import { calendarReturnUrl } from "@/lib/calendar-return-url";

describe("calendarReturnUrl", () => {
  it("keeps the week or month on screen", () => {
    expect(calendarReturnUrl("/dashboard", new URLSearchParams("mode=month&start=2026-12-01"))).toBe(
      "/dashboard?mode=month&start=2026-12-01",
    );
  });

  it("is the plain calendar when no week is picked", () => {
    expect(calendarReturnUrl("/dashboard", new URLSearchParams())).toBe("/dashboard");
  });

  it("leaves out the post-its pop-out, so closing it doesn't reopen it", () => {
    expect(calendarReturnUrl("/dashboard", new URLSearchParams("start=2026-12-01&panel=postits"))).toBe(
      "/dashboard?start=2026-12-01",
    );
  });

  it("ignores popup addresses", () => {
    expect(calendarReturnUrl("/dashboard/journals", new URLSearchParams("view=create"))).toBeNull();
  });
});
