import { describe, expect, it } from "vitest";
import { withRollback } from "../test/withRollback";
import {
  addDopamineMenuItem,
  deleteDopamineMenuItem,
  getRandomDopamineMenuItem,
  listDopamineMenuItems,
} from "./dopamine-menu";

describe("addDopamineMenuItem", () => {
  it("adds an item to the user's pool", async () => {
    await withRollback(async (tx) => {
      const item = await addDopamineMenuItem(tx, {
        userId: "test-user-1",
        text: "Take a 10 minute walk",
      });

      expect(item.text).toBe("Take a 10 minute walk");
      expect(item.userId).toBe("test-user-1");
    });
  });
});

describe("listDopamineMenuItems", () => {
  it("returns an empty list for a user with no items", async () => {
    await withRollback(async (tx) => {
      const result = await listDopamineMenuItems(tx, "test-user-1");
      expect(result).toEqual([]);
    });
  });

  it("never returns another user's items", async () => {
    await withRollback(async (tx) => {
      await addDopamineMenuItem(tx, { userId: "test-user-1", text: "Mine" });
      await addDopamineMenuItem(tx, { userId: "test-user-2", text: "Theirs" });

      const result = await listDopamineMenuItems(tx, "test-user-1");

      expect(result.map((i) => i.text)).toEqual(["Mine"]);
    });
  });
});

describe("getRandomDopamineMenuItem", () => {
  it("returns null when the pool is empty", async () => {
    await withRollback(async (tx) => {
      const result = await getRandomDopamineMenuItem(tx, "test-user-1");
      expect(result).toBeNull();
    });
  });

  it("returns one of the user's own items", async () => {
    await withRollback(async (tx) => {
      await addDopamineMenuItem(tx, { userId: "test-user-1", text: "Walk" });
      await addDopamineMenuItem(tx, { userId: "test-user-1", text: "Stretch" });
      await addDopamineMenuItem(tx, { userId: "test-user-2", text: "Not mine" });

      const result = await getRandomDopamineMenuItem(tx, "test-user-1");

      expect(["Walk", "Stretch"]).toContain(result?.text);
    });
  });
});

describe("deleteDopamineMenuItem", () => {
  it("deletes the item", async () => {
    await withRollback(async (tx) => {
      const item = await addDopamineMenuItem(tx, { userId: "test-user-1", text: "Walk" });

      await deleteDopamineMenuItem(tx, { userId: "test-user-1", itemId: item.id });

      const result = await listDopamineMenuItems(tx, "test-user-1");
      expect(result).toEqual([]);
    });
  });

  it("returns null when the item doesn't belong to the user", async () => {
    await withRollback(async (tx) => {
      const item = await addDopamineMenuItem(tx, { userId: "test-user-2", text: "Theirs" });

      const result = await deleteDopamineMenuItem(tx, {
        userId: "test-user-1",
        itemId: item.id,
      });

      expect(result).toBeNull();
    });
  });
});
