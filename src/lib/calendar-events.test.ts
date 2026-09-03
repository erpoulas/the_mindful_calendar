import { describe, expect, it } from "vitest";
import { withRollback } from "../test/withRollback";
import { createIntention } from "./intentions";
import { createProject } from "./projects";
import { createCalendarEvent } from "./calendar-events";

describe("createCalendarEvent", () => {
  it("creates an event with only a title", async () => {
    await withRollback(async (tx) => {
      const event = await createCalendarEvent(tx, {
        userId: "test-user-1",
        title: "Quick add",
      });

      expect(event.title).toBe("Quick add");
      expect(event.startAt).toBeNull();
      expect(event.endAt).toBeNull();
      expect(event.isAllDay).toBe(false);
      expect(event.location).toBeNull();
      expect(event.notes).toBeNull();
      expect(event.projectId).toBeNull();
      expect(event.intentions).toEqual([]);
    });
  });

  it("creates an event with the full set of optional details", async () => {
    await withRollback(async (tx) => {
      const startAt = new Date("2026-09-10T14:00:00Z");
      const endAt = new Date("2026-09-10T15:00:00Z");

      const event = await createCalendarEvent(tx, {
        userId: "test-user-1",
        title: "Dentist appointment",
        startAt,
        endAt,
        isAllDay: true,
        location: "123 Main St",
        notes: "Bring insurance card",
      });

      expect(event.startAt).toEqual(startAt);
      expect(event.endAt).toEqual(endAt);
      expect(event.isAllDay).toBe(true);
      expect(event.location).toBe("123 Main St");
      expect(event.notes).toBe("Bring insurance card");
    });
  });

  it("links to a project when provided", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      const project = await createProject(tx, {
        userId: "test-user-1",
        title: "Train for a 5k",
        endGoal: "Run the race",
        intentionIds: [intention.id],
      });

      const event = await createCalendarEvent(tx, {
        userId: "test-user-1",
        title: "Long run",
        projectId: project.id,
      });

      expect(event.projectId).toBe(project.id);
    });
  });

  it("links to one or more intentions when provided", async () => {
    await withRollback(async (tx) => {
      const health = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      const family = await createIntention(tx, { userId: "test-user-1", name: "Family" });

      const event = await createCalendarEvent(tx, {
        userId: "test-user-1",
        title: "Family walk",
        intentionIds: [health.id, family.id],
      });

      expect(event.intentions.map((ei) => ei.intentionId).sort()).toEqual(
        [health.id, family.id].sort(),
      );
    });
  });

  it("defaults intentions to none when not provided", async () => {
    await withRollback(async (tx) => {
      const event = await createCalendarEvent(tx, {
        userId: "test-user-1",
        title: "No intention yet",
      });

      expect(event.intentions).toEqual([]);
    });
  });
});
