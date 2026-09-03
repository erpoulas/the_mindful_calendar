import { describe, expect, it } from "vitest";
import { withRollback } from "../test/withRollback";
import {
  addQuickListItem,
  createQuickList,
  deleteQuickList,
  getQuickListDetail,
  listQuickLists,
  toggleQuickListItem,
  updateQuickList,
} from "./quick-lists";

describe("createQuickList", () => {
  it("creates a list with the given name for the user", async () => {
    await withRollback(async (tx) => {
      const list = await createQuickList(tx, { userId: "test-user-1", name: "Groceries" });

      expect(list.name).toBe("Groceries");
      expect(list.userId).toBe("test-user-1");
    });
  });
});

describe("listQuickLists", () => {
  it("returns an empty list for a user with no quick lists", async () => {
    await withRollback(async (tx) => {
      const result = await listQuickLists(tx, "test-user-1");
      expect(result).toEqual([]);
    });
  });

  it("returns all of the given user's quick lists", async () => {
    await withRollback(async (tx) => {
      await createQuickList(tx, { userId: "test-user-1", name: "Errands" });
      await createQuickList(tx, { userId: "test-user-1", name: "Groceries" });

      const result = await listQuickLists(tx, "test-user-1");

      expect(result.map((l) => l.name).sort()).toEqual(["Errands", "Groceries"]);
    });
  });

  it("never returns another user's quick lists", async () => {
    await withRollback(async (tx) => {
      await createQuickList(tx, { userId: "test-user-1", name: "Mine" });
      await createQuickList(tx, { userId: "test-user-2", name: "Theirs" });

      const result = await listQuickLists(tx, "test-user-1");

      expect(result.map((l) => l.name)).toEqual(["Mine"]);
    });
  });
});

describe("getQuickListDetail", () => {
  it("returns null when the list doesn't exist", async () => {
    await withRollback(async (tx) => {
      const result = await getQuickListDetail(tx, {
        userId: "test-user-1",
        quickListId: "does-not-exist",
      });
      expect(result).toBeNull();
    });
  });

  it("returns null when the list belongs to another user", async () => {
    await withRollback(async (tx) => {
      const list = await createQuickList(tx, { userId: "test-user-2", name: "Theirs" });

      const result = await getQuickListDetail(tx, {
        userId: "test-user-1",
        quickListId: list.id,
      });

      expect(result).toBeNull();
    });
  });

  it("returns the list with its items", async () => {
    await withRollback(async (tx) => {
      const list = await createQuickList(tx, { userId: "test-user-1", name: "Errands" });
      await addQuickListItem(tx, { userId: "test-user-1", quickListId: list.id, text: "Bank" });
      await addQuickListItem(tx, {
        userId: "test-user-1",
        quickListId: list.id,
        text: "Post office",
      });

      const result = await getQuickListDetail(tx, {
        userId: "test-user-1",
        quickListId: list.id,
      });

      expect(result?.name).toBe("Errands");
      expect(result?.items.map((i) => i.text)).toEqual(["Bank", "Post office"]);
    });
  });
});

describe("updateQuickList", () => {
  it("renames the list", async () => {
    await withRollback(async (tx) => {
      const list = await createQuickList(tx, { userId: "test-user-1", name: "Errands" });

      const updated = await updateQuickList(tx, {
        userId: "test-user-1",
        quickListId: list.id,
        name: "Weekend errands",
      });

      expect(updated?.name).toBe("Weekend errands");
    });
  });

  it("returns null when the list doesn't belong to the user", async () => {
    await withRollback(async (tx) => {
      const list = await createQuickList(tx, { userId: "test-user-2", name: "Theirs" });

      const result = await updateQuickList(tx, {
        userId: "test-user-1",
        quickListId: list.id,
        name: "Hijacked",
      });

      expect(result).toBeNull();
    });
  });
});

describe("deleteQuickList", () => {
  it("deletes the list and its items", async () => {
    await withRollback(async (tx) => {
      const list = await createQuickList(tx, { userId: "test-user-1", name: "Errands" });
      await addQuickListItem(tx, { userId: "test-user-1", quickListId: list.id, text: "Bank" });

      await deleteQuickList(tx, { userId: "test-user-1", quickListId: list.id });

      const result = await getQuickListDetail(tx, {
        userId: "test-user-1",
        quickListId: list.id,
      });
      expect(result).toBeNull();

      const items = await tx.quickListItem.findMany({ where: { quickListId: list.id } });
      expect(items).toEqual([]);
    });
  });

  it("returns null when the list doesn't belong to the user", async () => {
    await withRollback(async (tx) => {
      const list = await createQuickList(tx, { userId: "test-user-2", name: "Theirs" });

      const result = await deleteQuickList(tx, { userId: "test-user-1", quickListId: list.id });

      expect(result).toBeNull();
    });
  });
});

describe("addQuickListItem", () => {
  it("adds an item to the list", async () => {
    await withRollback(async (tx) => {
      const list = await createQuickList(tx, { userId: "test-user-1", name: "Errands" });

      const item = await addQuickListItem(tx, {
        userId: "test-user-1",
        quickListId: list.id,
        text: "Bank",
      });

      expect(item?.text).toBe("Bank");
      expect(item?.done).toBe(false);
    });
  });

  it("returns null when the list doesn't belong to the user", async () => {
    await withRollback(async (tx) => {
      const list = await createQuickList(tx, { userId: "test-user-2", name: "Theirs" });

      const item = await addQuickListItem(tx, {
        userId: "test-user-1",
        quickListId: list.id,
        text: "Sneaky item",
      });

      expect(item).toBeNull();
    });
  });
});

describe("toggleQuickListItem", () => {
  it("marks a not-done item as done", async () => {
    await withRollback(async (tx) => {
      const list = await createQuickList(tx, { userId: "test-user-1", name: "Errands" });
      const item = await addQuickListItem(tx, {
        userId: "test-user-1",
        quickListId: list.id,
        text: "Bank",
      });

      const updated = await toggleQuickListItem(tx, {
        userId: "test-user-1",
        itemId: item!.id,
      });

      expect(updated?.done).toBe(true);
    });
  });

  it("marks a done item as not-done (reversible)", async () => {
    await withRollback(async (tx) => {
      const list = await createQuickList(tx, { userId: "test-user-1", name: "Errands" });
      const item = await addQuickListItem(tx, {
        userId: "test-user-1",
        quickListId: list.id,
        text: "Bank",
      });

      await toggleQuickListItem(tx, { userId: "test-user-1", itemId: item!.id });
      const revertedBack = await toggleQuickListItem(tx, {
        userId: "test-user-1",
        itemId: item!.id,
      });

      expect(revertedBack?.done).toBe(false);
    });
  });

  it("returns null when the item's list doesn't belong to the user", async () => {
    await withRollback(async (tx) => {
      const list = await createQuickList(tx, { userId: "test-user-2", name: "Theirs" });
      const item = await addQuickListItem(tx, {
        userId: "test-user-2",
        quickListId: list.id,
        text: "Sneaky item",
      });

      const result = await toggleQuickListItem(tx, {
        userId: "test-user-1",
        itemId: item!.id,
      });

      expect(result).toBeNull();
    });
  });
});
