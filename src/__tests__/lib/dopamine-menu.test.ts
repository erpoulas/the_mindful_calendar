import { describe, expect, it } from "vitest";
import { withRollback } from "@/test/withRollback";
import {
  addDopamineMenuItem,
  deleteDopamineMenuItem,
  getRandomDopamineMenuItem,
  listDopamineMenuItems,
  setDopamineMenuItemIntention,
  updateDopamineMenuItemText,
} from "@/lib/dopamine-menu";
import { createIntention, deleteIntention } from "@/lib/intentions";

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

describe("setDopamineMenuItemIntention", () => {
  it("tags the item with one of the user's intentions, and clears it with null", async () => {
    await withRollback(async (tx) => {
      const item = await addDopamineMenuItem(tx, { userId: "test-user-1", text: "Walk" });
      const health = await createIntention(tx, { userId: "test-user-1", name: "Health" });

      const tagged = await setDopamineMenuItemIntention(tx, {
        userId: "test-user-1",
        itemId: item.id,
        intentionId: health.id,
      });
      expect(tagged?.intentionId).toBe(health.id);
      expect((await listDopamineMenuItems(tx, "test-user-1"))[0].intentionId).toBe(health.id);

      const cleared = await setDopamineMenuItemIntention(tx, {
        userId: "test-user-1",
        itemId: item.id,
        intentionId: null,
      });
      expect(cleared?.intentionId).toBeNull();
    });
  });

  it("returns null and changes nothing for another user's item", async () => {
    await withRollback(async (tx) => {
      const item = await addDopamineMenuItem(tx, { userId: "test-user-2", text: "Theirs" });
      const health = await createIntention(tx, { userId: "test-user-1", name: "Health" });

      const result = await setDopamineMenuItemIntention(tx, {
        userId: "test-user-1",
        itemId: item.id,
        intentionId: health.id,
      });

      expect(result).toBeNull();
      expect((await listDopamineMenuItems(tx, "test-user-2"))[0].intentionId).toBeNull();
    });
  });

  it("returns null and changes nothing for another user's intention", async () => {
    await withRollback(async (tx) => {
      const item = await addDopamineMenuItem(tx, { userId: "test-user-1", text: "Walk" });
      const theirs = await createIntention(tx, { userId: "test-user-2", name: "Theirs" });

      const result = await setDopamineMenuItemIntention(tx, {
        userId: "test-user-1",
        itemId: item.id,
        intentionId: theirs.id,
      });

      expect(result).toBeNull();
      expect((await listDopamineMenuItems(tx, "test-user-1"))[0].intentionId).toBeNull();
    });
  });

  it("untags the item when its intention is deleted, keeping the item", async () => {
    await withRollback(async (tx) => {
      const item = await addDopamineMenuItem(tx, { userId: "test-user-1", text: "Walk" });
      const health = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      await setDopamineMenuItemIntention(tx, {
        userId: "test-user-1",
        itemId: item.id,
        intentionId: health.id,
      });

      await deleteIntention(tx, { userId: "test-user-1", intentionId: health.id });

      const [kept] = await listDopamineMenuItems(tx, "test-user-1");
      expect(kept).toMatchObject({ id: item.id, intentionId: null });
    });
  });
});

describe("updateDopamineMenuItemText", () => {
  it("changes the item's text", async () => {
    await withRollback(async (tx) => {
      const item = await addDopamineMenuItem(tx, { userId: "test-user-1", text: "Walk" });

      const updated = await updateDopamineMenuItemText(tx, {
        userId: "test-user-1",
        itemId: item.id,
        text: "Walk by the river",
      });

      expect(updated?.text).toBe("Walk by the river");
      expect((await listDopamineMenuItems(tx, "test-user-1"))[0].text).toBe("Walk by the river");
    });
  });

  it("returns null and changes nothing for another user's item", async () => {
    await withRollback(async (tx) => {
      const item = await addDopamineMenuItem(tx, { userId: "test-user-2", text: "Theirs" });

      const result = await updateDopamineMenuItemText(tx, {
        userId: "test-user-1",
        itemId: item.id,
        text: "Mine now",
      });

      expect(result).toBeNull();
      expect((await listDopamineMenuItems(tx, "test-user-2"))[0].text).toBe("Theirs");
    });
  });
});
