import { describe, expect, it } from "vitest";
import { withRollback } from "@/test/withRollback";
import {
  getCalendarDisplaySettings,
  getUserTimezone,
  setCalendarDisplaySettings,
  getUserTimezoneWithFallback,
  setUserTimezone,
} from "@/lib/user-settings";

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

describe("getUserTimezoneWithFallback", () => {
  it("falls back to UTC when the user has never set a timezone", async () => {
    await withRollback(async (tx) => {
      const result = await getUserTimezoneWithFallback(tx, "test-user-1");
      expect(result).toBe("UTC");
    });
  });

  it("returns the stored timezone", async () => {
    await withRollback(async (tx) => {
      await setUserTimezone(tx, { userId: "test-user-1", timezone: "America/New_York" });

      const result = await getUserTimezoneWithFallback(tx, "test-user-1");

      expect(result).toBe("America/New_York");
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

describe("getCalendarDisplaySettings", () => {
  it("defaults to no extra zones and the 12-hour clock", async () => {
    await withRollback(async (tx) => {
      const result = await getCalendarDisplaySettings(tx, "test-user-1");
      expect(result).toEqual({ extraTimezones: [], use24HourClock: false });
    });
  });
});

describe("setCalendarDisplaySettings", () => {
  it("saves extra zones in order and the clock choice", async () => {
    await withRollback(async (tx) => {
      await setCalendarDisplaySettings(tx, {
        userId: "test-user-1",
        extraTimezones: ["America/Chicago", "Europe/London"],
        use24HourClock: true,
      });

      const result = await getCalendarDisplaySettings(tx, "test-user-1");

      expect(result).toEqual({
        extraTimezones: ["America/Chicago", "Europe/London"],
        use24HourClock: true,
      });
    });
  });

  it("leaves the saved main timezone alone", async () => {
    await withRollback(async (tx) => {
      await setUserTimezone(tx, { userId: "test-user-1", timezone: "America/Denver" });

      await setCalendarDisplaySettings(tx, {
        userId: "test-user-1",
        extraTimezones: ["America/Chicago"],
        use24HourClock: false,
      });

      expect(await getUserTimezone(tx, "test-user-1")).toBe("America/Denver");
    });
  });

  it("never touches another user's settings", async () => {
    await withRollback(async (tx) => {
      await setCalendarDisplaySettings(tx, {
        userId: "test-user-2",
        extraTimezones: ["Asia/Tokyo"],
        use24HourClock: true,
      });

      await setCalendarDisplaySettings(tx, {
        userId: "test-user-1",
        extraTimezones: [],
        use24HourClock: false,
      });

      const theirs = await getCalendarDisplaySettings(tx, "test-user-2");
      expect(theirs).toEqual({ extraTimezones: ["Asia/Tokyo"], use24HourClock: true });
    });
  });
});
