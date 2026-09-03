import { describe, expect, it } from "vitest";
import { withRollback } from "../test/withRollback";
import {
  addAffirmation,
  deleteAffirmation,
  getRandomAffirmation,
  getTodayAffirmation,
  listAffirmations,
  setTodayAffirmation,
} from "./affirmations";

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
    });
  });

  it("returns today's override without saving it to the permanent pool", async () => {
    await withRollback(async (tx) => {
      await setTodayAffirmation(tx, {
        userId: "test-user-1",
        text: "Just for today: be gentle with yourself",
      });

      const result = await getTodayAffirmation(tx, "test-user-1");
      const pool = await listAffirmations(tx, "test-user-1");

      expect(result?.text).toBe("Just for today: be gentle with yourself");
      expect(result?.isOverride).toBe(true);
      expect(pool).toEqual([]);
    });
  });

  it("replaces a previous override when set again", async () => {
    await withRollback(async (tx) => {
      await setTodayAffirmation(tx, { userId: "test-user-1", text: "First" });
      await setTodayAffirmation(tx, { userId: "test-user-1", text: "Second" });

      const result = await getTodayAffirmation(tx, "test-user-1");

      expect(result?.text).toBe("Second");
    });
  });

  it("falls back to the pool once the override is from a previous day", async () => {
    await withRollback(async (tx) => {
      await addAffirmation(tx, { userId: "test-user-1", text: "Pool pick" });
      await setTodayAffirmation(tx, { userId: "test-user-1", text: "Yesterday's override" });
      await tx.todayAffirmation.update({
        where: { userId: "test-user-1" },
        data: { setAt: new Date("2020-01-01T00:00:00Z") },
      });

      const result = await getTodayAffirmation(tx, "test-user-1");

      expect(result?.text).toBe("Pool pick");
      expect(result?.isOverride).toBe(false);
    });
  });
});
