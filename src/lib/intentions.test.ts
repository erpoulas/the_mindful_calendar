import { describe, expect, it } from "vitest";
import { withRollback } from "../test/withRollback";
import { createIntention, listIntentions } from "./intentions";

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
