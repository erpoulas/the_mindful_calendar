import { describe, expect, it } from "vitest";
import type { DbClient } from "./db";
import { withRollback } from "../test/withRollback";
import { createIntention, getIntentionDetail, listIntentions } from "./intentions";

// Test-only helper: creates a calendar event and tags it to an intention,
// the same way the app will once event creation exists as its own feature.
async function tagEvent(
  client: DbClient,
  data: { userId: string; intentionId: string; startAt?: Date; projectId?: string },
) {
  const event = await client.calendarEvent.create({
    data: {
      userId: data.userId,
      title: "Test event",
      startAt: data.startAt,
      projectId: data.projectId,
    },
  });
  await client.eventIntention.create({
    data: { eventId: event.id, intentionId: data.intentionId },
  });
  return event;
}

describe("createIntention", () => {
  it("creates an intention with the given name for the user", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, {
        userId: "test-user-1",
        name: "Health",
      });

      expect(intention.name).toBe("Health");
      expect(intention.userId).toBe("test-user-1");
      expect(intention.isSystem).toBe(false);
      expect(intention.color).toBeNull();
    });
  });

  it("stores an optional color when provided", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, {
        userId: "test-user-1",
        name: "Creativity",
        color: "#4a6a99",
      });

      expect(intention.color).toBe("#4a6a99");
    });
  });
});

describe("listIntentions", () => {
  it("returns an empty list for a user with no intentions", async () => {
    await withRollback(async (tx) => {
      const result = await listIntentions(tx, "test-user-1");
      expect(result).toEqual([]);
    });
  });

  it("returns all of the given user's intentions", async () => {
    await withRollback(async (tx) => {
      await createIntention(tx, { userId: "test-user-1", name: "Health" });
      await createIntention(tx, { userId: "test-user-1", name: "Creativity" });

      const result = await listIntentions(tx, "test-user-1");

      expect(result.map((i) => i.name).sort()).toEqual(["Creativity", "Health"]);
    });
  });

  it("never returns another user's intentions", async () => {
    await withRollback(async (tx) => {
      await createIntention(tx, { userId: "test-user-1", name: "Health" });
      await createIntention(tx, { userId: "test-user-2", name: "Someone else's" });

      const result = await listIntentions(tx, "test-user-1");

      expect(result.map((i) => i.name)).toEqual(["Health"]);
    });
  });
});

describe("getIntentionDetail", () => {
  const reference = new Date("2026-08-13T12:00:00Z");

  it("returns null when the intention doesn't exist", async () => {
    await withRollback(async (tx) => {
      const result = await getIntentionDetail(tx, {
        userId: "test-user-1",
        intentionId: "does-not-exist",
        referenceDate: reference,
      });
      expect(result).toBeNull();
    });
  });

  it("returns null when the intention belongs to another user", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-2", name: "Health" });

      const result = await getIntentionDetail(tx, {
        userId: "test-user-1",
        intentionId: intention.id,
        referenceDate: reference,
      });

      expect(result).toBeNull();
    });
  });

  it("returns the intention with an all-zero streak when nothing is tagged to it", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-1", name: "Health" });

      const result = await getIntentionDetail(tx, {
        userId: "test-user-1",
        intentionId: intention.id,
        referenceDate: reference,
      });

      expect(result?.intention.name).toBe("Health");
      expect(result?.weeklyStreak).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    });
  });

  it("counts events tagged directly to the intention with no project attached", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      await tagEvent(tx, { userId: "test-user-1", intentionId: intention.id, startAt: reference });

      const result = await getIntentionDetail(tx, {
        userId: "test-user-1",
        intentionId: intention.id,
        referenceDate: reference,
      });

      expect(result?.weeklyStreak).toEqual([0, 0, 0, 0, 0, 0, 0, 1]);
    });
  });

  it("does not count events that have a Project attached", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      const project = await tx.project.create({
        data: { userId: "test-user-1", title: "Train for a 5k", endGoal: "Run the race" },
      });
      await tagEvent(tx, {
        userId: "test-user-1",
        intentionId: intention.id,
        startAt: reference,
        projectId: project.id,
      });

      const result = await getIntentionDetail(tx, {
        userId: "test-user-1",
        intentionId: intention.id,
        referenceDate: reference,
      });

      expect(result?.weeklyStreak).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    });
  });

  it("does not count events tagged to a different intention", async () => {
    await withRollback(async (tx) => {
      const health = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      const family = await createIntention(tx, { userId: "test-user-1", name: "Family" });
      await tagEvent(tx, { userId: "test-user-1", intentionId: family.id, startAt: reference });

      const result = await getIntentionDetail(tx, {
        userId: "test-user-1",
        intentionId: health.id,
        referenceDate: reference,
      });

      expect(result?.weeklyStreak).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    });
  });
});
