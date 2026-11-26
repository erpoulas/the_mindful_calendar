import { describe, expect, it } from "vitest";
import { calendarEventHref, dashboardRoutes, stringParam } from "@/lib/dashboard-routes";

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

    it("schedules a project task as an event already linked to its project", () => {
      expect(dashboardRoutes.newEvent({ title: "Draft chapter 1", projectId: "p1" })).toBe(
        "/dashboard/event?view=new&title=Draft+chapter+1&projectId=p1",
      );
    });

    it("schedules a dopamine-menu item as an event already counting toward its intention", () => {
      expect(dashboardRoutes.newEvent({ title: "Walk", intentionId: "i1" })).toBe(
        "/dashboard/event?view=new&title=Walk&intentionId=i1",
      );
    });

    it("edits one event", () => {
      expect(dashboardRoutes.editEvent("e1")).toBe("/dashboard/event?view=edit&id=e1");
    });
  });

  it("opens an event's editor, or its journal for a journal entry's event", () => {
    expect(calendarEventHref({ id: "e1" })).toBe("/dashboard/event?view=edit&id=e1");
    expect(calendarEventHref({ id: "e1", journalEntry: null })).toBe("/dashboard/event?view=edit&id=e1");
    expect(calendarEventHref({ id: "e2", journalEntry: { journalId: "j1" } })).toBe("/dashboard/journals?id=j1");
  });

  it("opens the journals popup, on a chosen journal's tab", () => {
    expect(dashboardRoutes.journals()).toBe("/dashboard/journals");
    expect(dashboardRoutes.journals("j1")).toBe("/dashboard/journals?id=j1");
  });

  it("gives each quick list screen its own address, opening a chosen list's tab", () => {
    expect(dashboardRoutes.quickLists()).toBe("/dashboard/quick-lists");
    expect(dashboardRoutes.quickLists("q1")).toBe("/dashboard/quick-lists?id=q1");
  });

  it("gives each project screen its own address", () => {
    expect(dashboardRoutes.projects()).toBe("/dashboard/projects");
    expect(dashboardRoutes.newProject()).toBe("/dashboard/projects?view=create");
    expect(dashboardRoutes.project("p1")).toBe("/dashboard/projects?view=detail&id=p1");
    expect(dashboardRoutes.editProject("p1")).toBe("/dashboard/projects?view=edit&id=p1");
  });

  it("gives each intention screen its own address", () => {
    expect(dashboardRoutes.intentions()).toBe("/dashboard/intentions");
    expect(dashboardRoutes.intention("i1")).toBe("/dashboard/intentions?view=detail&id=i1");
    expect(dashboardRoutes.editIntention("i1")).toBe("/dashboard/intentions?view=edit&id=i1");
  });

  it("opens affirmations", () => {
    expect(dashboardRoutes.affirmations()).toBe("/dashboard/affirmations");
  });

  it("opens account settings, optionally with the result of connecting Google", () => {
    expect(dashboardRoutes.account()).toBe("/dashboard/account");
    expect(dashboardRoutes.account({ google: "connected" })).toBe("/dashboard/account?google=connected");
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
