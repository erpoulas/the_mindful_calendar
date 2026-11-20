import { afterEach, describe, expect, it, vi } from "vitest";

// A stand-in for Next's store: remembers results by key, and keeps the
// options each read was stored with so the tests can check its labels.
const { store, storedOptions, updateTag, revalidateTag } = vi.hoisted(() => ({
  store: new Map<string, unknown>(),
  storedOptions: [] as { keyParts: string[]; tags: string[]; revalidate: number }[],
  updateTag: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("next/cache", () => ({
  unstable_cache:
    (read: () => Promise<unknown>, keyParts: string[], options: { tags: string[]; revalidate: number }) =>
    async () => {
      storedOptions.push({ keyParts, ...options });
      const key = keyParts.join("|");
      if (!store.has(key)) store.set(key, await read());
      return store.get(key);
    },
  updateTag,
  revalidateTag,
}));

import {
  forgetStoredAfterSave,
  forgetStoredFromRoute,
  storedAreaTag,
  storedRead,
} from "@/lib/stored-results";

afterEach(() => {
  store.clear();
  storedOptions.length = 0;
  vi.clearAllMocks();
});

describe("storedRead", () => {
  it("reads the database once, then hands back the stored copy", async () => {
    const read = vi.fn(async (userId: string) => [{ id: "p1", owner: userId }]);
    const listProjects = storedRead("listProjects", ["projects"], read);

    await listProjects("user-1");
    const second = await listProjects("user-1");

    expect(read).toHaveBeenCalledTimes(1);
    expect(second).toEqual([{ id: "p1", owner: "user-1" }]);
  });

  it("keeps a separate copy per user and per arguments", async () => {
    const read = vi.fn(async (userId: string, weekStart: Date) => `${userId} ${weekStart.toISOString()}`);
    const weekEvents = storedRead("weekEvents", ["events"], read);

    await weekEvents("user-1", new Date("2026-11-16T00:00:00Z"));
    await weekEvents("user-2", new Date("2026-11-16T00:00:00Z"));
    await weekEvents("user-1", new Date("2026-11-23T00:00:00Z"));

    expect(read).toHaveBeenCalledTimes(3);
  });

  it("gives back dates as real Date objects", async () => {
    const startAt = new Date("2026-11-20T09:00:00Z");
    const getEvent = storedRead("getEvent", ["events"], async () => ({ startAt }));

    const event = await getEvent("user-1");

    expect(event.startAt).toBeInstanceOf(Date);
    expect(event.startAt).toEqual(startAt);
  });

  it("labels the copy with each area it was built from, for that user", async () => {
    const stats = storedRead("stats", ["events", "intentions"], async () => 1);

    await stats("user-1");

    expect(storedOptions[0].tags).toEqual([
      storedAreaTag("events", "user-1"),
      storedAreaTag("intentions", "user-1"),
    ]);
    expect(storedOptions[0].revalidate).toBeGreaterThan(0);
  });
});

describe("forgetting stored copies", () => {
  it("after a save, expires each area's label for that user", () => {
    forgetStoredAfterSave("user-1", ["events", "journals"]);

    expect(updateTag).toHaveBeenCalledWith("events:user-1");
    expect(updateTag).toHaveBeenCalledWith("journals:user-1");
  });

  it("from a route handler, expires the labels at once", () => {
    forgetStoredFromRoute("user-1", ["events"]);

    expect(revalidateTag).toHaveBeenCalledWith("events:user-1", { expire: 0 });
  });
});
