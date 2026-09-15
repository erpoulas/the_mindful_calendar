import { describe, expect, it } from "vitest";
import { withRollback } from "@/test/withRollback";
import { addQuickListItem, createQuickList } from "@/lib/quick-lists";
import {
  createPostIt,
  deletePostIt,
  listPostIts,
  promoteQuickListItemToPostIt,
  reorderPostIts,
} from "@/lib/post-its";

describe("createPostIt", () => {
  it("creates a post-it with the given text for the user", async () => {
    await withRollback(async (tx) => {
      const postIt = await createPostIt(tx, { userId: "test-user-1", text: "Buy stamps" });

      expect(postIt.text).toBe("Buy stamps");
      expect(postIt.userId).toBe("test-user-1");
    });
  });

  it("assigns the next order after the user's existing post-its", async () => {
    await withRollback(async (tx) => {
      const first = await createPostIt(tx, { userId: "test-user-1", text: "First" });
      const second = await createPostIt(tx, { userId: "test-user-1", text: "Second" });

      expect(first.order).toBe(0);
      expect(second.order).toBe(1);
    });
  });

  it("orders relative to only that user's post-its, not everyone's", async () => {
    await withRollback(async (tx) => {
      await createPostIt(tx, { userId: "test-user-2", text: "Theirs" });
      await createPostIt(tx, { userId: "test-user-2", text: "Theirs again" });

      const mine = await createPostIt(tx, { userId: "test-user-1", text: "Mine" });

      expect(mine.order).toBe(0);
    });
  });
});

describe("listPostIts", () => {
  it("returns an empty list for a user with no post-its", async () => {
    await withRollback(async (tx) => {
      const result = await listPostIts(tx, "test-user-1");
      expect(result).toEqual([]);
    });
  });

  it("returns all of the given user's post-its", async () => {
    await withRollback(async (tx) => {
      await createPostIt(tx, { userId: "test-user-1", text: "Buy stamps" });
      await createPostIt(tx, { userId: "test-user-1", text: "Call dentist" });

      const result = await listPostIts(tx, "test-user-1");

      expect(result.map((p) => p.text).sort()).toEqual(["Buy stamps", "Call dentist"]);
    });
  });

  it("never returns another user's post-its", async () => {
    await withRollback(async (tx) => {
      await createPostIt(tx, { userId: "test-user-1", text: "Mine" });
      await createPostIt(tx, { userId: "test-user-2", text: "Theirs" });

      const result = await listPostIts(tx, "test-user-1");

      expect(result.map((p) => p.text)).toEqual(["Mine"]);
    });
  });

  it("returns post-its by their order field, not creation time", async () => {
    await withRollback(async (tx) => {
      const a = await createPostIt(tx, { userId: "test-user-1", text: "A" });
      const b = await createPostIt(tx, { userId: "test-user-1", text: "B" });

      await reorderPostIts(tx, { userId: "test-user-1", orderedIds: [b.id, a.id] });

      const result = await listPostIts(tx, "test-user-1");
      expect(result.map((p) => p.text)).toEqual(["B", "A"]);
    });
  });
});

describe("reorderPostIts", () => {
  it("updates order to match the given sequence", async () => {
    await withRollback(async (tx) => {
      const a = await createPostIt(tx, { userId: "test-user-1", text: "A" });
      const b = await createPostIt(tx, { userId: "test-user-1", text: "B" });
      const c = await createPostIt(tx, { userId: "test-user-1", text: "C" });

      await reorderPostIts(tx, { userId: "test-user-1", orderedIds: [c.id, a.id, b.id] });

      const result = await listPostIts(tx, "test-user-1");
      expect(result.map((p) => p.text)).toEqual(["C", "A", "B"]);
    });
  });

  it("ignores ids that don't belong to the user", async () => {
    await withRollback(async (tx) => {
      const mine = await createPostIt(tx, { userId: "test-user-1", text: "Mine" });
      const theirs = await createPostIt(tx, { userId: "test-user-2", text: "Theirs" });

      await reorderPostIts(tx, { userId: "test-user-1", orderedIds: [theirs.id, mine.id] });

      const theirsAfter = await tx.postIt.findUnique({ where: { id: theirs.id } });
      expect(theirsAfter?.order).toBe(0);
    });
  });
});

describe("deletePostIt", () => {
  it("deletes the post-it", async () => {
    await withRollback(async (tx) => {
      const postIt = await createPostIt(tx, { userId: "test-user-1", text: "Buy stamps" });

      await deletePostIt(tx, { userId: "test-user-1", postItId: postIt.id });

      const result = await listPostIts(tx, "test-user-1");
      expect(result).toEqual([]);
    });
  });

  it("returns null when the post-it doesn't belong to the user", async () => {
    await withRollback(async (tx) => {
      const postIt = await createPostIt(tx, { userId: "test-user-2", text: "Theirs" });

      const result = await deletePostIt(tx, { userId: "test-user-1", postItId: postIt.id });

      expect(result).toBeNull();
    });
  });
});

describe("promoteQuickListItemToPostIt", () => {
  it("creates a post-it with the item's text and removes the item from its list", async () => {
    await withRollback(async (tx) => {
      const list = await createQuickList(tx, { userId: "test-user-1", name: "Errands" });
      const item = await addQuickListItem(tx, {
        userId: "test-user-1",
        quickListId: list.id,
        text: "Buy stamps",
      });

      const postIt = await promoteQuickListItemToPostIt(tx, {
        userId: "test-user-1",
        itemId: item!.id,
      });

      expect(postIt?.text).toBe("Buy stamps");

      const items = await tx.quickListItem.findMany({ where: { quickListId: list.id } });
      expect(items).toEqual([]);

      const postIts = await listPostIts(tx, "test-user-1");
      expect(postIts.map((p) => p.text)).toEqual(["Buy stamps"]);
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

      const result = await promoteQuickListItemToPostIt(tx, {
        userId: "test-user-1",
        itemId: item!.id,
      });

      expect(result).toBeNull();
    });
  });

  it("does not remove the item when the item doesn't exist", async () => {
    await withRollback(async (tx) => {
      const result = await promoteQuickListItemToPostIt(tx, {
        userId: "test-user-1",
        itemId: "does-not-exist",
      });

      expect(result).toBeNull();
    });
  });
});
