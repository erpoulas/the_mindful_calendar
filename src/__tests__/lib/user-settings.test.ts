import { describe, expect, it } from "vitest";
import { withRollback } from "@/test/withRollback";
import type { DbClient } from "@/lib/db";
import {
  getCalendarDisplaySettings,
  getUserSettings,
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

  // Google-linked events are stored in the main zone's wall-clock time, so
  // a new zone means re-reading them from Google (see google-sync.test.ts).
  async function googleLinkedEtag(tx: DbClient, change: () => Promise<unknown>) {
    const synced = new Date("2026-11-12T00:00:00Z");
    const event = await tx.calendarEvent.create({
      data: {
        userId: "test-user-1",
        title: "Walk",
        startAt: new Date("2026-11-18T15:00:00Z"),
        googleEventId: "walk",
        googleEtag: '"v1"',
        lastSyncedAt: synced,
        updatedAt: synced,
      },
    });
    await change();
    return (await tx.calendarEvent.findUnique({ where: { id: event.id } }))?.googleEtag;
  }

  it("marks Google-linked events for re-reading when the zone changes", async () => {
    await withRollback(async (tx) => {
      const etag = await googleLinkedEtag(tx, () =>
        setUserTimezone(tx, { userId: "test-user-1", timezone: "America/Denver" }),
      );
      expect(etag).toBeNull();
    });
  });

  it("leaves Google-linked events alone when the same zone is saved again", async () => {
    await withRollback(async (tx) => {
      await setUserTimezone(tx, { userId: "test-user-1", timezone: "America/Denver" });

      const etag = await googleLinkedEtag(tx, () =>
        setUserTimezone(tx, { userId: "test-user-1", timezone: "America/Denver" }),
      );
      expect(etag).toBe('"v1"');
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

describe("getUserSettings", () => {
  it("gives no timezone and the default display settings to a new user", async () => {
    await withRollback(async (tx) => {
      const result = await getUserSettings(tx, "test-user-1");

      expect(result).toEqual({ timezone: null, extraTimezones: [], use24HourClock: false });
    });
  });

  it("returns the timezone and display settings together", async () => {
    await withRollback(async (tx) => {
      await setUserTimezone(tx, { userId: "test-user-1", timezone: "America/Denver" });
      await setCalendarDisplaySettings(tx, {
        userId: "test-user-1",
        extraTimezones: ["Europe/Paris"],
        use24HourClock: true,
      });
      await setUserTimezone(tx, { userId: "test-user-2", timezone: "Asia/Tokyo" });

      const result = await getUserSettings(tx, "test-user-1");

      expect(result).toEqual({
        timezone: "America/Denver",
        extraTimezones: ["Europe/Paris"],
        use24HourClock: true,
      });
    });
  });
});
