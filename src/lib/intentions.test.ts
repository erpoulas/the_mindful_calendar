import { describe, expect, it } from "vitest";
import { withRollback } from "../test/withRollback";
import { createIntention } from "./intentions";

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
