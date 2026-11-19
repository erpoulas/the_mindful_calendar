import { describe, expect, it } from "vitest";
import { dashboardRoutes } from "@/lib/dashboard-routes";

describe("dashboardRoutes", () => {
  it("points the calendar at /dashboard", () => {
    expect(dashboardRoutes.calendar()).toBe("/dashboard");
  });

  it("gives each popup its own address under /dashboard", () => {
    expect(dashboardRoutes.dopamineMenu()).toBe("/dashboard/dopamine-menu");
  });
});
