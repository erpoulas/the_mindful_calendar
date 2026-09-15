import { describe, expect, it } from "vitest";
import { withRollback } from "@/test/withRollback";
import {
  getHiddenPanels,
  getPanelOrder,
  reorderPanels,
  sortPanelKeys,
  togglePanelVisibility,
} from "@/lib/dashboard-preferences";

describe("getHiddenPanels", () => {
  it("returns an empty list when the user has never set any preferences", async () => {
    await withRollback(async (tx) => {
      const result = await getHiddenPanels(tx, "test-user-1");
      expect(result).toEqual([]);
    });
  });

  it("returns the stored hidden panel keys", async () => {
    await withRollback(async (tx) => {
      await togglePanelVisibility(tx, { userId: "test-user-1", panelKey: "affirmation" });

      const result = await getHiddenPanels(tx, "test-user-1");

      expect(result).toEqual(["affirmation"]);
    });
  });

  it("never returns another user's hidden panels", async () => {
    await withRollback(async (tx) => {
      await togglePanelVisibility(tx, { userId: "test-user-2", panelKey: "season" });

      const result = await getHiddenPanels(tx, "test-user-1");

      expect(result).toEqual([]);
    });
  });
});

describe("togglePanelVisibility", () => {
  it("hides a panel from a fresh (no-row) state", async () => {
    await withRollback(async (tx) => {
      const prefs = await togglePanelVisibility(tx, {
        userId: "test-user-1",
        panelKey: "quicklist",
      });

      expect(prefs.hiddenPanels).toEqual(["quicklist"]);
    });
  });

  it("un-hides a panel that was already hidden (round-trip)", async () => {
    await withRollback(async (tx) => {
      await togglePanelVisibility(tx, { userId: "test-user-1", panelKey: "quicklist" });

      const prefs = await togglePanelVisibility(tx, {
        userId: "test-user-1",
        panelKey: "quicklist",
      });

      expect(prefs.hiddenPanels).toEqual([]);
    });
  });

  it("accumulates multiple hidden panels", async () => {
    await withRollback(async (tx) => {
      await togglePanelVisibility(tx, { userId: "test-user-1", panelKey: "quicklist" });

      const prefs = await togglePanelVisibility(tx, {
        userId: "test-user-1",
        panelKey: "journal",
      });

      expect(prefs.hiddenPanels.sort()).toEqual(["journal", "quicklist"]);
    });
  });

  it("never touches another user's hidden panels", async () => {
    await withRollback(async (tx) => {
      await togglePanelVisibility(tx, { userId: "test-user-2", panelKey: "season" });

      const prefs = await togglePanelVisibility(tx, {
        userId: "test-user-1",
        panelKey: "quicklist",
      });

      expect(prefs.hiddenPanels).toEqual(["quicklist"]);

      const theirs = await getHiddenPanels(tx, "test-user-2");
      expect(theirs).toEqual(["season"]);
    });
  });
});

describe("getPanelOrder", () => {
  it("returns an empty list when the user has never reordered panels", async () => {
    await withRollback(async (tx) => {
      const result = await getPanelOrder(tx, "test-user-1");
      expect(result).toEqual([]);
    });
  });

  it("returns the stored panel order", async () => {
    await withRollback(async (tx) => {
      await reorderPanels(tx, { userId: "test-user-1", orderedKeys: ["journal", "affirmation"] });

      const result = await getPanelOrder(tx, "test-user-1");

      expect(result).toEqual(["journal", "affirmation"]);
    });
  });

  it("never returns another user's panel order", async () => {
    await withRollback(async (tx) => {
      await reorderPanels(tx, { userId: "test-user-2", orderedKeys: ["journal", "affirmation"] });

      const result = await getPanelOrder(tx, "test-user-1");

      expect(result).toEqual([]);
    });
  });
});

describe("reorderPanels", () => {
  it("saves an order from a fresh (no-row) state", async () => {
    await withRollback(async (tx) => {
      const prefs = await reorderPanels(tx, {
        userId: "test-user-1",
        orderedKeys: ["dopamine", "review", "affirmation"],
      });

      expect(prefs.panelOrder).toEqual(["dopamine", "review", "affirmation"]);
    });
  });

  it("overwrites a previously saved order", async () => {
    await withRollback(async (tx) => {
      await reorderPanels(tx, { userId: "test-user-1", orderedKeys: ["dopamine", "review"] });

      const prefs = await reorderPanels(tx, {
        userId: "test-user-1",
        orderedKeys: ["review", "dopamine"],
      });

      expect(prefs.panelOrder).toEqual(["review", "dopamine"]);
    });
  });

  it("leaves the user's hidden-panels list untouched", async () => {
    await withRollback(async (tx) => {
      await togglePanelVisibility(tx, { userId: "test-user-1", panelKey: "journal" });

      const prefs = await reorderPanels(tx, {
        userId: "test-user-1",
        orderedKeys: ["dopamine", "review"],
      });

      expect(prefs.hiddenPanels).toEqual(["journal"]);
    });
  });

  it("never touches another user's panel order", async () => {
    await withRollback(async (tx) => {
      await reorderPanels(tx, { userId: "test-user-2", orderedKeys: ["journal"] });

      await reorderPanels(tx, { userId: "test-user-1", orderedKeys: ["dopamine"] });

      const theirs = await getPanelOrder(tx, "test-user-2");
      expect(theirs).toEqual(["journal"]);
    });
  });
});

describe("sortPanelKeys", () => {
  it("returns the default order when nothing has been stored", () => {
    const result = sortPanelKeys(["affirmation", "breakdown", "journal"], []);
    expect(result).toEqual(["affirmation", "breakdown", "journal"]);
  });

  it("applies the stored order for keys it knows about", () => {
    const result = sortPanelKeys(["affirmation", "breakdown", "journal"], ["journal", "affirmation"]);
    expect(result).toEqual(["journal", "affirmation", "breakdown"]);
  });

  it("appends default keys missing from the stored order, in default order", () => {
    const result = sortPanelKeys(["affirmation", "breakdown", "journal"], ["journal"]);
    expect(result).toEqual(["journal", "affirmation", "breakdown"]);
  });

  it("ignores stored keys that are no longer in the default set", () => {
    const result = sortPanelKeys(["affirmation", "breakdown"], ["season", "breakdown", "affirmation"]);
    expect(result).toEqual(["breakdown", "affirmation"]);
  });
});
