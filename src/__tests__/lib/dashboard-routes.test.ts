import { describe, expect, it } from "vitest";
import { dashboardRoutes, stringParam } from "@/lib/dashboard-routes";

describe("dashboardRoutes", () => {
  it("points the calendar at /dashboard", () => {
    expect(dashboardRoutes.calendar()).toBe("/dashboard");
  });

  it("gives each popup its own address under /dashboard", () => {
    expect(dashboardRoutes.dopamineMenu()).toBe("/dashboard/dopamine-menu");
  });

  describe("events", () => {
    it("opens a blank new event", () => {
      expect(dashboardRoutes.newEvent()).toBe("/dashboard/event?view=new");
    });

    it("prefills a new event, encoding the title and leaving out what's missing", () => {
      expect(dashboardRoutes.newEvent({ date: "2026-11-18T09:00", title: "Call mum & dad" })).toBe(
        "/dashboard/event?view=new&date=2026-11-18T09%3A00&title=Call+mum+%26+dad",
      );
    });

    it("links a post-it dropped on the calendar to the event it becomes", () => {
      expect(dashboardRoutes.newEvent({ date: "2026-11-18", title: "Gym", postItId: "p1" })).toBe(
        "/dashboard/event?view=new&date=2026-11-18&title=Gym&postItId=p1",
      );
    });

    it("edits one event", () => {
      expect(dashboardRoutes.editEvent("e1")).toBe("/dashboard/event?view=edit&id=e1");
    });
  });
});

describe("stringParam", () => {
  it("keeps a single value", () => {
    expect(stringParam("abc")).toBe("abc");
  });

  it("ignores a missing or repeated param", () => {
    expect(stringParam(undefined)).toBeUndefined();
    expect(stringParam(["a", "b"])).toBeUndefined();
  });
});
