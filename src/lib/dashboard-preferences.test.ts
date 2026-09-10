import { describe, expect, it } from "vitest";
import { withRollback } from "../test/withRollback";
import { getHiddenPanels, togglePanelVisibility } from "./dashboard-preferences";

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
