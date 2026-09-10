import { describe, expect, it } from "vitest";
import { withRollback } from "../test/withRollback";
import { createCalendarEvent } from "./calendar-events";
import { getWeekRange } from "./calendar-week";
import { createIntention } from "./intentions";
import { addProjectTask, createProject, toggleProjectTask } from "./projects";
import { addQuickListItem, createQuickList, toggleQuickListItem } from "./quick-lists";
import { getWeeklyIntentionBreakdown, getWeeklyReviewStats } from "./dashboard";

const referenceDate = new Date("2026-09-09T12:00:00Z"); // a Wednesday
const { start: weekStart, end: weekEnd } = getWeekRange(referenceDate);
const beforeThisWeek = new Date(weekStart.getTime() - 24 * 60 * 60 * 1000);
const duringThisWeek = new Date(weekStart.getTime() + 24 * 60 * 60 * 1000);

describe("getWeeklyIntentionBreakdown", () => {
  it("returns zeroed-out results when the user has no events this week", async () => {
    await withRollback(async (tx) => {
      const result = await getWeeklyIntentionBreakdown(tx, {
        userId: "test-user-1",
        referenceDate,
      });

      expect(result.totalCount).toBe(0);
      expect(result.breakdown).toEqual([]);
      expect(result.untagged).toEqual({ count: 0, percent: 0 });
    });
  });

  it("counts an event tagged to one intention", async () => {
    await withRollback(async (tx) => {
      const health = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      await createCalendarEvent(tx, {
        userId: "test-user-1",
        title: "Run",
        startAt: duringThisWeek,
        intentionIds: [health.id],
      });

      const result = await getWeeklyIntentionBreakdown(tx, {
        userId: "test-user-1",
        referenceDate,
      });

      expect(result.totalCount).toBe(1);
      expect(result.breakdown).toEqual([
        { intentionId: health.id, name: "Health", count: 1, percent: 100 },
      ]);
      expect(result.untagged).toEqual({ count: 0, percent: 0 });
    });
  });

  it("counts an event tagged to multiple intentions once per intention", async () => {
    await withRollback(async (tx) => {
      const health = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      const family = await createIntention(tx, { userId: "test-user-1", name: "Family" });
      await createCalendarEvent(tx, {
        userId: "test-user-1",
        title: "Family hike",
        startAt: duringThisWeek,
        intentionIds: [health.id, family.id],
      });

      const result = await getWeeklyIntentionBreakdown(tx, {
        userId: "test-user-1",
        referenceDate,
      });

      expect(result.totalCount).toBe(1);
      expect(result.breakdown.find((b) => b.name === "Health")?.count).toBe(1);
      expect(result.breakdown.find((b) => b.name === "Family")?.count).toBe(1);
    });
  });

  it("counts an untagged event separately from the intention breakdown", async () => {
    await withRollback(async (tx) => {
      const health = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      await createCalendarEvent(tx, {
        userId: "test-user-1",
        title: "Untagged errand",
        startAt: duringThisWeek,
      });

      const result = await getWeeklyIntentionBreakdown(tx, {
        userId: "test-user-1",
        referenceDate,
      });

      expect(result.totalCount).toBe(1);
      expect(result.breakdown).toEqual([
        { intentionId: health.id, name: "Health", count: 0, percent: 0 },
      ]);
      expect(result.untagged).toEqual({ count: 1, percent: 100 });
    });
  });

  it("excludes events outside the reference week", async () => {
    await withRollback(async (tx) => {
      const health = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      await createCalendarEvent(tx, {
        userId: "test-user-1",
        title: "Last week's run",
        startAt: beforeThisWeek,
        intentionIds: [health.id],
      });

      const result = await getWeeklyIntentionBreakdown(tx, {
        userId: "test-user-1",
        referenceDate,
      });

      expect(result.totalCount).toBe(0);
    });
  });

  it("never counts another user's events", async () => {
    await withRollback(async (tx) => {
      const mine = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      const theirs = await createIntention(tx, { userId: "test-user-2", name: "Health" });
      await createCalendarEvent(tx, {
        userId: "test-user-1",
        title: "Mine",
        startAt: duringThisWeek,
        intentionIds: [mine.id],
      });
      await createCalendarEvent(tx, {
        userId: "test-user-2",
        title: "Theirs",
        startAt: duringThisWeek,
        intentionIds: [theirs.id],
      });

      const result = await getWeeklyIntentionBreakdown(tx, {
        userId: "test-user-1",
        referenceDate,
      });

      expect(result.totalCount).toBe(1);
    });
  });
});

describe("getWeeklyReviewStats", () => {
  it("returns all-zero stats for a user with nothing this week", async () => {
    await withRollback(async (tx) => {
      const result = await getWeeklyReviewStats(tx, { userId: "test-user-1", referenceDate });

      expect(result.intentionBreakdown.totalCount).toBe(0);
      expect(result.tasksCompleted).toBe(0);
      expect(result.quickListItemsCompleted).toBe(0);
      expect(result.projectsCompleted).toBe(0);
    });
  });

  it("counts a project task completed this week", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      const project = await createProject(tx, {
        userId: "test-user-1",
        title: "Train for a 5k",
        endGoal: "Run the race",
        intentionIds: [intention.id],
      });
      const task = await addProjectTask(tx, {
        userId: "test-user-1",
        projectId: project.id,
        text: "Buy shoes",
      });
      await toggleProjectTask(tx, { userId: "test-user-1", taskId: task!.id });

      const result = await getWeeklyReviewStats(tx, { userId: "test-user-1", referenceDate });

      expect(result.tasksCompleted).toBe(1);
    });
  });

  it("counts a quick list item completed this week", async () => {
    await withRollback(async (tx) => {
      const list = await createQuickList(tx, { userId: "test-user-1", name: "Errands" });
      const item = await addQuickListItem(tx, {
        userId: "test-user-1",
        quickListId: list.id,
        text: "Bank",
      });
      await toggleQuickListItem(tx, { userId: "test-user-1", itemId: item!.id });

      const result = await getWeeklyReviewStats(tx, { userId: "test-user-1", referenceDate });

      expect(result.quickListItemsCompleted).toBe(1);
    });
  });

  it("never counts another user's completed tasks or items", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-2", name: "Health" });
      const project = await createProject(tx, {
        userId: "test-user-2",
        title: "Theirs",
        endGoal: "n/a",
        intentionIds: [intention.id],
      });
      const task = await addProjectTask(tx, {
        userId: "test-user-2",
        projectId: project.id,
        text: "Their task",
      });
      await toggleProjectTask(tx, { userId: "test-user-2", taskId: task!.id });

      const result = await getWeeklyReviewStats(tx, { userId: "test-user-1", referenceDate });

      expect(result.tasksCompleted).toBe(0);
    });
  });
});
