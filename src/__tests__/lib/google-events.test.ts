import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { withRollback } from "@/test/withRollback";
import { getGoogleConnection, saveGoogleConnection } from "@/lib/google-connections";
import { getGoogleEventsForRange } from "@/lib/google-events";

const NOW = new Date("2026-11-18T12:00:00Z");
// A week in New York, as wall-clock times (Mon 16 Nov 00:00 to Mon 23 Nov 00:00).
const WEEK = {
  start: new Date("2026-11-16T00:00:00Z"),
  end: new Date("2026-11-23T00:00:00Z"),
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function eventsResponse(items: unknown[]) {
  return jsonResponse({ items });
}

beforeEach(() => {
  vi.stubEnv("GOOGLE_CLIENT_ID", "test-client-id");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-client-secret");
  vi.stubEnv("GOOGLE_REDIRECT_URI", "http://localhost:3000/auth/google/callback");
  // Errors are logged on purpose in some tests; keep the output quiet.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function connect(tx: Parameters<typeof saveGoogleConnection>[0], expiresAt: Date) {
  await saveGoogleConnection(tx, {
    userId: "test-user-1",
    refreshToken: "refresh-1",
    accessToken: "access-1",
    accessTokenExpiresAt: expiresAt,
  });
}

const params = { userId: "test-user-1", ...WEEK, timeZone: "America/New_York", now: NOW };

describe("getGoogleEventsForRange", () => {
  it("returns nothing, without calling Google, when the user never connected", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await withRollback(async (tx) => {
      expect(await getGoogleEventsForRange(tx, params)).toEqual([]);
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks Google for the real moments the wall-clock week covers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(eventsResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    await withRollback(async (tx) => {
      await connect(tx, new Date("2026-11-18T13:00:00Z"));
      await getGoogleEventsForRange(tx, params);
    });

    const url = new URL(fetchMock.mock.calls[0][0]);
    // Midnight in New York (UTC-5 in November) is 05:00 UTC.
    expect(url.searchParams.get("timeMin")).toBe("2026-11-16T05:00:00.000Z");
    expect(url.searchParams.get("timeMax")).toBe("2026-11-23T05:00:00.000Z");
  });

  it("returns the week's events as wall-clock items, dropping ones outside the week", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        eventsResponse([
          {
            id: "dentist",
            summary: "Dentist",
            start: { dateTime: "2026-11-18T09:00:00-05:00" },
            end: { dateTime: "2026-11-18T10:00:00-05:00" },
          },
          // A trip that began the week before overlaps the range, so Google
          // returns it, but our own events only show on their start day.
          { id: "trip", summary: "Trip", start: { date: "2026-11-12" }, end: { date: "2026-11-17" } },
          { id: "gone", status: "cancelled", start: { date: "2026-11-18" } },
        ]),
      ),
    );

    await withRollback(async (tx) => {
      await connect(tx, new Date("2026-11-18T13:00:00Z"));
      const items = await getGoogleEventsForRange(tx, params);

      expect(items.map((item) => item.title)).toEqual(["Dentist"]);
      expect(items[0].startAt).toEqual(new Date("2026-11-18T09:00:00Z"));
    });
  });

  it("refreshes and saves an expired access token before asking for events", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "access-2", expires_in: 3600 }))
      .mockResolvedValueOnce(eventsResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    await withRollback(async (tx) => {
      await connect(tx, new Date("2026-11-18T11:00:00Z"));
      await getGoogleEventsForRange(tx, params);

      expect(fetchMock.mock.calls[0][0]).toBe("https://oauth2.googleapis.com/token");
      expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer access-2");
      const connection = await getGoogleConnection(tx, "test-user-1");
      expect(connection?.accessToken).toBe("access-2");
      expect(connection?.accessTokenExpiresAt).toEqual(new Date("2026-11-18T13:00:00Z"));
    });
  });

  it("refreshes once and retries when Google rejects a not-yet-expired access token", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 401))
      .mockResolvedValueOnce(jsonResponse({ access_token: "access-2", expires_in: 3600 }))
      .mockResolvedValueOnce(eventsResponse([{ id: "a", start: { date: "2026-11-18" } }]));
    vi.stubGlobal("fetch", fetchMock);

    await withRollback(async (tx) => {
      await connect(tx, new Date("2026-11-18T13:00:00Z"));
      const items = await getGoogleEventsForRange(tx, params);

      expect(items).toHaveLength(1);
      expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe("Bearer access-2");
    });
  });

  it("forgets the connection when Google refuses the refresh token, so the user can reconnect", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: "invalid_grant" }, 400)),
    );

    await withRollback(async (tx) => {
      await connect(tx, new Date("2026-11-18T11:00:00Z"));

      expect(await getGoogleEventsForRange(tx, params)).toEqual([]);
      expect(await getGoogleConnection(tx, "test-user-1")).toBeNull();
    });
  });

  it("keeps the connection and returns nothing when Google is down", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 503)));

    await withRollback(async (tx) => {
      await connect(tx, new Date("2026-11-18T13:00:00Z"));

      expect(await getGoogleEventsForRange(tx, params)).toEqual([]);
      expect(await getGoogleConnection(tx, "test-user-1")).not.toBeNull();
    });
  });
});
