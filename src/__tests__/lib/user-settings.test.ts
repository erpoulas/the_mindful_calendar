import { describe, expect, it } from "vitest";
import { withRollback } from "@/test/withRollback";
import { getUserTimezone, setUserTimezone } from "@/lib/user-settings";

describe("getUserTimezone", () => {
  it("returns null when the user has never set a timezone", async () => {
    await withRollback(async (tx) => {
      const result = await getUserTimezone(tx, "test-user-1");
      expect(result).toBeNull();
    });
  });

  it("returns the stored timezone", async () => {
    await withRollback(async (tx) => {
      await setUserTimezone(tx, { userId: "test-user-1", timezone: "America/New_York" });

      const result = await getUserTimezone(tx, "test-user-1");

      expect(result).toBe("America/New_York");
    });
  });

  it("never returns another user's timezone", async () => {
    await withRollback(async (tx) => {
      await setUserTimezone(tx, { userId: "test-user-2", timezone: "Europe/London" });

      const result = await getUserTimezone(tx, "test-user-1");

      expect(result).toBeNull();
    });
  });
});

describe("setUserTimezone", () => {
  it("creates a row from a fresh (no-row) state", async () => {
    await withRollback(async (tx) => {
      const settings = await setUserTimezone(tx, {
        userId: "test-user-1",
        timezone: "Asia/Tokyo",
      });

      expect(settings.timezone).toBe("Asia/Tokyo");
    });
  });

  it("overwrites a previously stored timezone", async () => {
    await withRollback(async (tx) => {
      await setUserTimezone(tx, { userId: "test-user-1", timezone: "Asia/Tokyo" });

      const settings = await setUserTimezone(tx, {
        userId: "test-user-1",
        timezone: "America/Los_Angeles",
      });

      expect(settings.timezone).toBe("America/Los_Angeles");
    });
  });

  it("never touches another user's timezone", async () => {
    await withRollback(async (tx) => {
      await setUserTimezone(tx, { userId: "test-user-2", timezone: "Europe/London" });

      await setUserTimezone(tx, { userId: "test-user-1", timezone: "Asia/Tokyo" });

      const theirs = await getUserTimezone(tx, "test-user-2");
      expect(theirs).toBe("Europe/London");
    });
  });
});
