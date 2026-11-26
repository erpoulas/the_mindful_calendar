import { describe, expect, it } from "vitest";
import { withRollback } from "@/test/withRollback";
import {
  addAffirmation,
  clearTodayAffirmation,
  deleteAffirmation,
  getRandomAffirmation,
  getTodayAffirmation,
  keepAffirmationUntil,
  listAffirmations,
  setTodayAffirmation,
} from "@/lib/affirmations";

describe("addAffirmation", () => {
  it("adds an affirmation to the user's permanent pool", async () => {
    await withRollback(async (tx) => {
      const affirmation = await addAffirmation(tx, {
        userId: "test-user-1",
        text: "I am capable of hard things",
      });

      expect(affirmation.text).toBe("I am capable of hard things");
    });
  });
});

describe("listAffirmations", () => {
  it("never returns another user's affirmations", async () => {
    await withRollback(async (tx) => {
      await addAffirmation(tx, { userId: "test-user-1", text: "Mine" });
      await addAffirmation(tx, { userId: "test-user-2", text: "Theirs" });

      const result = await listAffirmations(tx, "test-user-1");

      expect(result.map((a) => a.text)).toEqual(["Mine"]);
    });
  });
});

describe("getRandomAffirmation", () => {
  it("returns null when the pool is empty", async () => {
    await withRollback(async (tx) => {
      const result = await getRandomAffirmation(tx, "test-user-1");
      expect(result).toBeNull();
    });
  });

  it("returns one of the user's own affirmations", async () => {
    await withRollback(async (tx) => {
      await addAffirmation(tx, { userId: "test-user-1", text: "A" });
      await addAffirmation(tx, { userId: "test-user-1", text: "B" });

      const result = await getRandomAffirmation(tx, "test-user-1");

      expect(["A", "B"]).toContain(result?.text);
    });
  });
});

describe("deleteAffirmation", () => {
  it("deletes the affirmation", async () => {
    await withRollback(async (tx) => {
      const affirmation = await addAffirmation(tx, { userId: "test-user-1", text: "A" });

      await deleteAffirmation(tx, { userId: "test-user-1", affirmationId: affirmation.id });

      const result = await listAffirmations(tx, "test-user-1");
      expect(result).toEqual([]);
    });
  });

  it("returns null when the affirmation doesn't belong to the user", async () => {
    await withRollback(async (tx) => {
      const affirmation = await addAffirmation(tx, { userId: "test-user-2", text: "Theirs" });

      const result = await deleteAffirmation(tx, {
        userId: "test-user-1",
        affirmationId: affirmation.id,
      });

      expect(result).toBeNull();
    });
  });
});

describe("setTodayAffirmation / getTodayAffirmation", () => {
  const NOV_18 = new Date("2026-11-18T00:00:00Z");

  it("returns null when there's no override and no pool", async () => {
    await withRollback(async (tx) => {
      const result = await getTodayAffirmation(tx, "test-user-1");
      expect(result).toBeNull();
    });
  });

  it("falls back to a random pool pick when no override is set", async () => {
    await withRollback(async (tx) => {
      await addAffirmation(tx, { userId: "test-user-1", text: "A" });

      const result = await getTodayAffirmation(tx, "test-user-1");

      expect(result?.text).toBe("A");
      expect(result?.isOverride).toBe(false);
      expect(result?.keepUntil).toBeNull();
    });
  });

  it("returns the override without saving it to the permanent pool", async () => {
    await withRollback(async (tx) => {
      await setTodayAffirmation(tx, {
        userId: "test-user-1",
        text: "Be gentle with yourself",
        keepUntil: NOV_18,
      });

      const result = await getTodayAffirmation(
        tx,
        "test-user-1",
        "UTC",
        new Date("2026-11-18T12:00:00Z"),
      );
      const pool = await listAffirmations(tx, "test-user-1");

      expect(result).toEqual({
        text: "Be gentle with yourself",
        isOverride: true,
        keepUntil: NOV_18,
      });
      expect(pool).toEqual([]);
    });
  });

  it("replaces a previous override when set again", async () => {
    await withRollback(async (tx) => {
      await setTodayAffirmation(tx, { userId: "test-user-1", text: "First", keepUntil: null });
      await setTodayAffirmation(tx, { userId: "test-user-1", text: "Second", keepUntil: null });

      const result = await getTodayAffirmation(tx, "test-user-1");

      expect(result?.text).toBe("Second");
    });
  });

  it("keeps an override with no end date until it's changed", async () => {
    await withRollback(async (tx) => {
      await addAffirmation(tx, { userId: "test-user-1", text: "Pool pick" });
      await setTodayAffirmation(tx, { userId: "test-user-1", text: "Forever", keepUntil: null });

      const result = await getTodayAffirmation(
        tx,
        "test-user-1",
        "UTC",
        new Date("2030-01-01T12:00:00Z"),
      );

      expect(result?.text).toBe("Forever");
    });
  });

  it("falls back to the pool the day after the override's last day", async () => {
    await withRollback(async (tx) => {
      await addAffirmation(tx, { userId: "test-user-1", text: "Pool pick" });
      await setTodayAffirmation(tx, { userId: "test-user-1", text: "Old", keepUntil: NOV_18 });

      const result = await getTodayAffirmation(
        tx,
        "test-user-1",
        "UTC",
        new Date("2026-11-19T12:00:00Z"),
      );

      expect(result?.text).toBe("Pool pick");
      expect(result?.isOverride).toBe(false);
    });
  });

  it("keeps the override through its last day in the user's time zone", async () => {
    await withRollback(async (tx) => {
      await addAffirmation(tx, { userId: "test-user-1", text: "Pool pick" });
      await setTodayAffirmation(tx, { userId: "test-user-1", text: "Mine", keepUntil: NOV_18 });

      const result = await getTodayAffirmation(
        tx,
        "test-user-1",
        "America/New_York",
        new Date("2026-11-19T03:00:00Z"), // 10pm Nov 18 in New York
      );

      expect(result?.text).toBe("Mine");
    });
  });
});

describe("clearTodayAffirmation", () => {
  it("ends the override so the pool is used again", async () => {
    await withRollback(async (tx) => {
      await addAffirmation(tx, { userId: "test-user-1", text: "Pool pick" });
      await setTodayAffirmation(tx, { userId: "test-user-1", text: "Pinned", keepUntil: null });

      await clearTodayAffirmation(tx, "test-user-1");

      const result = await getTodayAffirmation(tx, "test-user-1");
      expect(result?.text).toBe("Pool pick");
    });
  });

  it("does nothing when no override is set", async () => {
    await withRollback(async (tx) => {
      await expect(clearTodayAffirmation(tx, "test-user-1")).resolves.not.toThrow();
    });
  });
});

describe("keepAffirmationUntil", () => {
  const now = new Date("2026-11-19T03:00:00Z"); // 10pm Nov 18 in New York

  it("ends today for 'today', counting the day in the user's time zone", () => {
    expect(keepAffirmationUntil("today", "America/New_York", now)).toEqual(
      new Date("2026-11-18T00:00:00Z"),
    );
  });

  it("covers seven days, today included, for 'week'", () => {
    expect(keepAffirmationUntil("week", "America/New_York", now)).toEqual(
      new Date("2026-11-24T00:00:00Z"),
    );
  });

  it("ends the day before the same date next month for 'month'", () => {
    expect(keepAffirmationUntil("month", "America/New_York", now)).toEqual(
      new Date("2026-12-17T00:00:00Z"),
    );
  });

  it("has no end date for 'forever'", () => {
    expect(keepAffirmationUntil("forever", "America/New_York", now)).toBeNull();
  });
});
