import { describe, expect, it } from "vitest";
import { withRollback } from "../test/withRollback";
import { createCalendarEvent } from "./calendar-events";
import { createIntention } from "./intentions";
import {
  createSeason,
  deleteSeason,
  getSeasonDetail,
  listSeasons,
  reflectOnSeason,
  updateSeason,
} from "./seasons";

describe("createSeason", () => {
  it("creates a season with just a name", async () => {
    await withRollback(async (tx) => {
      const season = await createSeason(tx, { userId: "test-user-1", name: "Fall 2026" });

      expect(season.name).toBe("Fall 2026");
      expect(season.startDate).toBeNull();
      expect(season.endDate).toBeNull();
      expect(season.note).toBeNull();
    });
  });

  it("creates a season with optional dates and a note", async () => {
    await withRollback(async (tx) => {
      const startDate = new Date("2026-09-01T00:00:00Z");
      const endDate = new Date("2026-11-30T00:00:00Z");

      const season = await createSeason(tx, {
        userId: "test-user-1",
        name: "Fall 2026",
        startDate,
        endDate,
        note: "Focus on consistency, not intensity",
      });

      expect(season.startDate).toEqual(startDate);
      expect(season.endDate).toEqual(endDate);
      expect(season.note).toBe("Focus on consistency, not intensity");
    });
  });
});

describe("listSeasons", () => {
  it("returns an empty list for a user with no seasons", async () => {
    await withRollback(async (tx) => {
      const result = await listSeasons(tx, "test-user-1");
      expect(result).toEqual([]);
    });
  });

  it("never returns another user's seasons", async () => {
    await withRollback(async (tx) => {
      await createSeason(tx, { userId: "test-user-1", name: "Mine" });
      await createSeason(tx, { userId: "test-user-2", name: "Theirs" });

      const result = await listSeasons(tx, "test-user-1");

      expect(result.map((s) => s.name)).toEqual(["Mine"]);
    });
  });
});

describe("getSeasonDetail", () => {
  it("returns null when the season doesn't exist", async () => {
    await withRollback(async (tx) => {
      const result = await getSeasonDetail(tx, {
        userId: "test-user-1",
        seasonId: "does-not-exist",
      });
      expect(result).toBeNull();
    });
  });

  it("returns null when the season belongs to another user", async () => {
    await withRollback(async (tx) => {
      const season = await createSeason(tx, { userId: "test-user-2", name: "Theirs" });

      const result = await getSeasonDetail(tx, {
        userId: "test-user-1",
        seasonId: season.id,
      });

      expect(result).toBeNull();
    });
  });

  it("returns a zero-count breakdown when nothing is tagged", async () => {
    await withRollback(async (tx) => {
      await createIntention(tx, { userId: "test-user-1", name: "Health" });
      const season = await createSeason(tx, { userId: "test-user-1", name: "Fall 2026" });

      const result = await getSeasonDetail(tx, {
        userId: "test-user-1",
        seasonId: season.id,
      });

      expect(result?.intentionBreakdown).toEqual([
        { intentionId: expect.any(String), name: "Health", count: 0 },
      ]);
    });
  });

  it("counts events tagged to each intention within the season's date range", async () => {
    await withRollback(async (tx) => {
      const health = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      const family = await createIntention(tx, { userId: "test-user-1", name: "Family" });
      const season = await createSeason(tx, {
        userId: "test-user-1",
        name: "Fall 2026",
        startDate: new Date("2026-09-01T00:00:00Z"),
        endDate: new Date("2026-11-30T00:00:00Z"),
      });

      await createCalendarEvent(tx, {
        userId: "test-user-1",
        title: "Run",
        startAt: new Date("2026-09-15T09:00:00Z"),
        intentionIds: [health.id],
      });
      await createCalendarEvent(tx, {
        userId: "test-user-1",
        title: "Run again",
        startAt: new Date("2026-09-20T09:00:00Z"),
        intentionIds: [health.id],
      });
      await createCalendarEvent(tx, {
        userId: "test-user-1",
        title: "Outside the range",
        startAt: new Date("2026-08-01T09:00:00Z"),
        intentionIds: [health.id],
      });

      const result = await getSeasonDetail(tx, {
        userId: "test-user-1",
        seasonId: season.id,
      });

      const breakdown = result?.intentionBreakdown ?? [];
      expect(breakdown.find((b) => b.name === "Health")?.count).toBe(2);
      expect(breakdown.find((b) => b.name === "Family")?.count).toBe(0);
    });
  });
});

describe("updateSeason", () => {
  it("updates the name, dates, and note", async () => {
    await withRollback(async (tx) => {
      const season = await createSeason(tx, { userId: "test-user-1", name: "Fall 2026" });

      const updated = await updateSeason(tx, {
        userId: "test-user-1",
        seasonId: season.id,
        name: "Autumn 2026",
        note: "Updated note",
      });

      expect(updated?.name).toBe("Autumn 2026");
      expect(updated?.note).toBe("Updated note");
    });
  });

  it("returns null when the season doesn't belong to the user", async () => {
    await withRollback(async (tx) => {
      const season = await createSeason(tx, { userId: "test-user-2", name: "Theirs" });

      const result = await updateSeason(tx, {
        userId: "test-user-1",
        seasonId: season.id,
        name: "Hijacked",
      });

      expect(result).toBeNull();
    });
  });
});

describe("reflectOnSeason", () => {
  it("stores the reflection text and stamps reflectedAt", async () => {
    await withRollback(async (tx) => {
      const season = await createSeason(tx, {
        userId: "test-user-1",
        name: "Fall 2026",
        note: "Focus on consistency",
      });

      const reflected = await reflectOnSeason(tx, {
        userId: "test-user-1",
        seasonId: season.id,
        reflectionText: "I mostly did, a few weeks slipped",
      });

      expect(reflected?.reflectionText).toBe("I mostly did, a few weeks slipped");
      expect(reflected?.reflectedAt).not.toBeNull();
      expect(reflected?.note).toBe("Focus on consistency");
    });
  });

  it("can be updated more than once (not gated behind the season ending)", async () => {
    await withRollback(async (tx) => {
      const season = await createSeason(tx, { userId: "test-user-1", name: "Fall 2026" });

      await reflectOnSeason(tx, {
        userId: "test-user-1",
        seasonId: season.id,
        reflectionText: "First pass",
      });
      const second = await reflectOnSeason(tx, {
        userId: "test-user-1",
        seasonId: season.id,
        reflectionText: "Updated thoughts",
      });

      expect(second?.reflectionText).toBe("Updated thoughts");
    });
  });

  it("returns null when the season doesn't belong to the user", async () => {
    await withRollback(async (tx) => {
      const season = await createSeason(tx, { userId: "test-user-2", name: "Theirs" });

      const result = await reflectOnSeason(tx, {
        userId: "test-user-1",
        seasonId: season.id,
        reflectionText: "Sneaky",
      });

      expect(result).toBeNull();
    });
  });
});

describe("deleteSeason", () => {
  it("deletes the season", async () => {
    await withRollback(async (tx) => {
      const season = await createSeason(tx, { userId: "test-user-1", name: "Fall 2026" });

      await deleteSeason(tx, { userId: "test-user-1", seasonId: season.id });

      const result = await getSeasonDetail(tx, { userId: "test-user-1", seasonId: season.id });
      expect(result).toBeNull();
    });
  });

  it("returns null when the season doesn't belong to the user", async () => {
    await withRollback(async (tx) => {
      const season = await createSeason(tx, { userId: "test-user-2", name: "Theirs" });

      const result = await deleteSeason(tx, { userId: "test-user-1", seasonId: season.id });

      expect(result).toBeNull();
    });
  });
});
