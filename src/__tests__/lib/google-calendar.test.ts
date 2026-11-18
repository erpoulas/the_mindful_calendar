import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildGoogleAuthUrl,
  exchangeCodeForTokens,
  fetchGoogleEvents,
  GoogleAuthError,
  isGoogleCalendarConfigured,
  refreshAccessToken,
  toGoogleCalendarItem,
} from "@/lib/google-calendar";

const NOW = new Date("2026-11-18T12:00:00Z");

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.stubEnv("GOOGLE_CLIENT_ID", "test-client-id");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-client-secret");
  vi.stubEnv("GOOGLE_REDIRECT_URI", "http://localhost:3000/auth/google/callback");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("isGoogleCalendarConfigured", () => {
  it("is true when all three Google variables are set", () => {
    expect(isGoogleCalendarConfigured()).toBe(true);
  });

  it("is false when one is missing", () => {
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "");
    expect(isGoogleCalendarConfigured()).toBe(false);
  });
});

describe("buildGoogleAuthUrl", () => {
  it("asks for read-only calendar access, offline, with the given state", () => {
    const url = new URL(buildGoogleAuthUrl("state-123"));

    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: "test-client-id",
      redirect_uri: "http://localhost:3000/auth/google/callback",
      response_type: "code",
      scope: "https://www.googleapis.com/auth/calendar.events.readonly",
      access_type: "offline",
      prompt: "consent",
      state: "state-123",
    });
  });
});

describe("exchangeCodeForTokens", () => {
  it("sends the code and returns both tokens with the access token's expiry", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ access_token: "access-1", refresh_token: "refresh-1", expires_in: 3600 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const tokens = await exchangeCodeForTokens("code-abc", NOW);

    expect(tokens).toEqual({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      accessTokenExpiresAt: new Date("2026-11-18T13:00:00Z"),
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://oauth2.googleapis.com/token");
    const body = new URLSearchParams(init.body);
    expect(body.get("code")).toBe("code-abc");
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("client_secret")).toBe("test-client-secret");
  });

  it("throws when Google gives no refresh token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ access_token: "access-1", expires_in: 3600 })),
    );

    await expect(exchangeCodeForTokens("code-abc", NOW)).rejects.toThrow(/refresh token/);
  });

  it("throws when Google rejects the code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: "invalid_grant" }, 400)),
    );

    await expect(exchangeCodeForTokens("bad-code", NOW)).rejects.toThrow(GoogleAuthError);
  });
});

describe("refreshAccessToken", () => {
  it("returns a new access token and expiry", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ access_token: "access-2", expires_in: 1800 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await refreshAccessToken("refresh-1", NOW);

    expect(result).toEqual({
      accessToken: "access-2",
      accessTokenExpiresAt: new Date("2026-11-18T12:30:00Z"),
    });
    const body = new URLSearchParams(fetchMock.mock.calls[0][1].body);
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe("refresh-1");
  });

  it("throws GoogleAuthError when the refresh token was revoked or expired", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: "invalid_grant" }, 400)),
    );

    await expect(refreshAccessToken("refresh-1", NOW)).rejects.toThrow(GoogleAuthError);
  });

  it("throws a plain Error (not GoogleAuthError) when Google is down", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 503)));

    const error = await refreshAccessToken("refresh-1", NOW).catch((caught) => caught);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(GoogleAuthError);
  });
});

describe("fetchGoogleEvents", () => {
  const range = {
    timeMin: new Date("2026-11-16T05:00:00Z"),
    timeMax: new Date("2026-11-23T05:00:00Z"),
  };

  it("asks for single events in the range from the primary calendar", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [{ id: "a" }] }));
    vi.stubGlobal("fetch", fetchMock);

    const events = await fetchGoogleEvents("access-1", range);

    expect(events).toEqual([{ id: "a" }]);
    const [url, init] = fetchMock.mock.calls[0];
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    );
    expect(parsed.searchParams.get("timeMin")).toBe("2026-11-16T05:00:00.000Z");
    expect(parsed.searchParams.get("timeMax")).toBe("2026-11-23T05:00:00.000Z");
    expect(parsed.searchParams.get("singleEvents")).toBe("true");
    expect(init.headers.Authorization).toBe("Bearer access-1");
  });

  it("follows nextPageToken until every page is read", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ items: [{ id: "a" }], nextPageToken: "page-2" }))
      .mockResolvedValueOnce(jsonResponse({ items: [{ id: "b" }] }));
    vi.stubGlobal("fetch", fetchMock);

    const events = await fetchGoogleEvents("access-1", range);

    expect(events.map((event) => event.id)).toEqual(["a", "b"]);
    expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get("pageToken")).toBe("page-2");
  });

  it("throws GoogleAuthError when the access token is rejected", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 401)));

    await expect(fetchGoogleEvents("access-1", range)).rejects.toThrow(GoogleAuthError);
  });
});

describe("toGoogleCalendarItem", () => {
  it("turns a timed event into wall-clock times in the user's time zone", () => {
    const item = toGoogleCalendarItem(
      {
        id: "abc",
        summary: "Dentist",
        htmlLink: "https://calendar.google.com/event?eid=abc",
        start: { dateTime: "2026-11-18T09:00:00-05:00" },
        end: { dateTime: "2026-11-18T10:30:00-05:00" },
      },
      "America/New_York",
    );

    expect(item).toEqual({
      id: "google:abc",
      title: "Dentist",
      startAt: new Date("2026-11-18T09:00:00Z"),
      endAt: new Date("2026-11-18T10:30:00Z"),
      isAllDay: false,
      htmlLink: "https://calendar.google.com/event?eid=abc",
    });
  });

  it("shows an event created in another zone at the user's local time", () => {
    const item = toGoogleCalendarItem(
      {
        id: "abc",
        summary: "Call with London",
        start: { dateTime: "2026-11-18T15:00:00Z" },
        end: { dateTime: "2026-11-18T16:00:00Z" },
      },
      "America/New_York",
    );

    expect(item?.startAt).toEqual(new Date("2026-11-18T10:00:00Z"));
  });

  it("keeps all-day events on their date", () => {
    const item = toGoogleCalendarItem(
      { id: "abc", summary: "Holiday", start: { date: "2026-11-26" }, end: { date: "2026-11-27" } },
      "America/New_York",
    );

    expect(item).toMatchObject({
      startAt: new Date("2026-11-26T00:00:00Z"),
      endAt: new Date("2026-11-27T00:00:00Z"),
      isAllDay: true,
    });
  });

  it("gives untitled events a placeholder title", () => {
    const item = toGoogleCalendarItem(
      { id: "abc", start: { date: "2026-11-26" } },
      "UTC",
    );

    expect(item?.title).toBe("(No title)");
  });

  it("skips cancelled events and events with no start", () => {
    expect(
      toGoogleCalendarItem({ id: "a", status: "cancelled", start: { date: "2026-11-26" } }, "UTC"),
    ).toBeNull();
    expect(toGoogleCalendarItem({ id: "b" }, "UTC")).toBeNull();
  });
});
