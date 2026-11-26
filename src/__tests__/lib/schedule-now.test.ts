import { describe, expect, it } from "vitest";
import { withRollback } from "@/test/withRollback";
import { addDopamineMenuItem, setDopamineMenuItemIntention } from "@/lib/dopamine-menu";
import { createIntention } from "@/lib/intentions";
import { addProjectTask, createProject } from "@/lib/projects";
import { addQuickListItem, createQuickList } from "@/lib/quick-lists";
import {
  oneHourStartingAt,
  scheduleDopamineItemNow,
  scheduleProjectTaskNow,
  scheduleQuickListItemNow,
} from "@/lib/schedule-now";

// "Now" on the user's wall clock: 2:37:45pm.
const now = new Date("2026-11-21T14:37:45.500Z");
const start = new Date("2026-11-21T14:37:00.000Z");
const end = new Date("2026-11-21T15:37:00.000Z");

describe("oneHourStartingAt", () => {
  it("starts at the clicked minute and lasts an hour", () => {
    expect(oneHourStartingAt(now)).toEqual({ startAt: start, endAt: end });
  });
});

describe("scheduleQuickListItemNow", () => {
  it("creates a 1-hour event named after the item, noting its list", async () => {
    await withRollback(async (tx) => {
      const list = await createQuickList(tx, { userId: "test-user-1", name: "Groceries" });
      const item = await addQuickListItem(tx, {
        userId: "test-user-1",
        quickListId: list.id,
        text: "Buy milk",
      });

      const event = await scheduleQuickListItemNow(tx, {
        userId: "test-user-1",
        itemId: item!.id,
        now,
      });

      expect(event).toMatchObject({
        userId: "test-user-1",
        title: "Buy milk",
        notes: "From quick list: Groceries",
        startAt: start,
        endAt: end,
        isAllDay: false,
      });
    });
  });

  it("does nothing for another user's item", async () => {
    await withRollback(async (tx) => {
      const list = await createQuickList(tx, { userId: "test-user-1", name: "Groceries" });
      const item = await addQuickListItem(tx, {
        userId: "test-user-1",
        quickListId: list.id,
        text: "Buy milk",
      });

      const event = await scheduleQuickListItemNow(tx, {
        userId: "test-user-2",
        itemId: item!.id,
        now,
      });

      expect(event).toBeNull();
      expect(await tx.calendarEvent.count({ where: { userId: "test-user-2" } })).toBe(0);
    });
  });
});

describe("scheduleProjectTaskNow", () => {
  it("creates the event inside the task's project, noting the project", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      const project = await createProject(tx, {
        userId: "test-user-1",
        title: "Garden",
        endGoal: "Grow tomatoes",
        intentionIds: [intention.id],
      });
      const task = await addProjectTask(tx, {
        userId: "test-user-1",
        projectId: project.id,
        text: "Buy seeds",
      });

      const event = await scheduleProjectTaskNow(tx, {
        userId: "test-user-1",
        taskId: task!.id,
        now,
      });

      expect(event).toMatchObject({
        title: "Buy seeds",
        notes: "Task in project: Garden",
        projectId: project.id,
        startAt: start,
        endAt: end,
      });
    });
  });

  it("does nothing for another user's task", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      const project = await createProject(tx, {
        userId: "test-user-1",
        title: "Garden",
        endGoal: "Grow tomatoes",
        intentionIds: [intention.id],
      });
      const task = await addProjectTask(tx, {
        userId: "test-user-1",
        projectId: project.id,
        text: "Buy seeds",
      });

      expect(
        await scheduleProjectTaskNow(tx, { userId: "test-user-2", taskId: task!.id, now }),
      ).toBeNull();
    });
  });
});

describe("scheduleDopamineItemNow", () => {
  it("creates the event from a dopamine-menu item", async () => {
    await withRollback(async (tx) => {
      const item = await addDopamineMenuItem(tx, { userId: "test-user-1", text: "Take a walk" });

      const event = await scheduleDopamineItemNow(tx, {
        userId: "test-user-1",
        itemId: item.id,
        now,
      });

      expect(event).toMatchObject({
        title: "Take a walk",
        notes: "From your dopamine menu",
        startAt: start,
        endAt: end,
      });
    });
  });

  it("counts the event toward the item's intention", async () => {
    await withRollback(async (tx) => {
      const item = await addDopamineMenuItem(tx, { userId: "test-user-1", text: "Take a walk" });
      const health = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      await setDopamineMenuItemIntention(tx, {
        userId: "test-user-1",
        itemId: item.id,
        intentionId: health.id,
      });

      const event = await scheduleDopamineItemNow(tx, { userId: "test-user-1", itemId: item.id, now });

      expect(event?.intentions.map((ei) => ei.intentionId)).toEqual([health.id]);
    });
  });

  it("adds no intention for an untagged item", async () => {
    await withRollback(async (tx) => {
      const item = await addDopamineMenuItem(tx, { userId: "test-user-1", text: "Take a walk" });

      const event = await scheduleDopamineItemNow(tx, { userId: "test-user-1", itemId: item.id, now });

      expect(event?.intentions).toEqual([]);
    });
  });

  it("does nothing for another user's item", async () => {
    await withRollback(async (tx) => {
      const item = await addDopamineMenuItem(tx, { userId: "test-user-1", text: "Take a walk" });

      expect(
        await scheduleDopamineItemNow(tx, { userId: "test-user-2", itemId: item.id, now }),
      ).toBeNull();
    });
  });
});
