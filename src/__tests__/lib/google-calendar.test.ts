import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildGoogleAuthUrl,
  deleteGoogleEvent,
  exchangeCodeForTokens,
  fetchGoogleEvents,
  fromGoogleEvent,
  getGoogleEvent,
  googleEventIdFor,
  GoogleAuthError,
  insertGoogleEvent,
  isGoogleCalendarConfigured,
  patchGoogleEvent,
  refreshAccessToken,
  toGoogleEventBody,
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
  it("asks for read-and-write event access, offline, with the given state", () => {
    const url = new URL(buildGoogleAuthUrl("state-123"));

    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: "test-client-id",
      redirect_uri: "http://localhost:3000/auth/google/callback",
      response_type: "code",
      scope: "https://www.googleapis.com/auth/calendar.events",
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

  it("asks for single events in the range, deleted ones included, from the primary calendar", async () => {
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
    expect(parsed.searchParams.get("showDeleted")).toBe("true");
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

const EVENT_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

describe("getGoogleEvent", () => {
  it("returns the event", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: "abc", summary: "Dentist" }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await getGoogleEvent("access-1", "abc")).toEqual({ id: "abc", summary: "Dentist" });
    expect(fetchMock.mock.calls[0][0]).toBe(`${EVENT_URL}/abc`);
  });

  it("returns null when Google has no such event", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 404)));

    expect(await getGoogleEvent("access-1", "abc")).toBeNull();
  });
});

describe("googleEventIdFor", () => {
  it("turns our UUID into a valid Google event id", () => {
    expect(googleEventIdFor("6F1C2B3A-1111-4222-8333-444455556666")).toBe(
      "6f1c2b3a111142228333444455556666",
    );
  });
});

describe("insertGoogleEvent", () => {
  it("creates the event under our chosen id", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: "abc12", etag: '"1"' }));
    vi.stubGlobal("fetch", fetchMock);

    const created = await insertGoogleEvent("access-1", "abc12", { summary: "Gym" });

    expect(created).toEqual({ id: "abc12", etag: '"1"' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(EVENT_URL);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ summary: "Gym", id: "abc12" });
  });

  it("returns the existing event when an earlier attempt already created it", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse({}, 409))
        .mockResolvedValueOnce(jsonResponse({ id: "abc12", etag: '"1"' })),
    );

    expect(await insertGoogleEvent("access-1", "abc12", { summary: "Gym" })).toEqual({
      id: "abc12",
      etag: '"1"',
    });
  });
});

describe("patchGoogleEvent", () => {
  it("sends the changed fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: "abc", etag: '"2"' }));
    vi.stubGlobal("fetch", fetchMock);

    await patchGoogleEvent("access-1", "abc", { summary: "Gym, later" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${EVENT_URL}/abc`);
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({ summary: "Gym, later" });
  });

  it("returns null when the event was deleted in Google", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 410)));

    expect(await patchGoogleEvent("access-1", "abc", { summary: "x" })).toBeNull();
  });
});

describe("deleteGoogleEvent", () => {
  it("deletes the event", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await deleteGoogleEvent("access-1", "abc");

    expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
  });

  it("treats an already deleted event as done", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 410)));

    await expect(deleteGoogleEvent("access-1", "abc")).resolves.toBeUndefined();
  });

  it("throws when Google is down, so the deletion is retried later", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 503)));

    await expect(deleteGoogleEvent("access-1", "abc")).rejects.toThrow(/503/);
  });
});

describe("fromGoogleEvent", () => {
  it("turns a timed event into wall-clock times in the user's time zone", () => {
    const fields = fromGoogleEvent(
      {
        id: "abc",
        summary: "Dentist",
        location: "Main St",
        description: "Bring forms",
        start: { dateTime: "2026-11-18T09:00:00-05:00" },
        end: { dateTime: "2026-11-18T10:30:00-05:00" },
      },
      "America/New_York",
    );

    expect(fields).toEqual({
      title: "Dentist",
      startAt: new Date("2026-11-18T09:00:00Z"),
      endAt: new Date("2026-11-18T10:30:00Z"),
      isAllDay: false,
      location: "Main St",
      notes: "Bring forms",
    });
  });

  it("shows an event created in another zone at the user's local time", () => {
    const fields = fromGoogleEvent(
      {
        id: "abc",
        start: { dateTime: "2026-11-18T15:00:00Z" },
        end: { dateTime: "2026-11-18T16:00:00Z" },
      },
      "America/New_York",
    );

    expect(fields?.startAt).toEqual(new Date("2026-11-18T10:00:00Z"));
  });

  it("gives a one-day all-day event no end, since Google's end date is the next day", () => {
    const fields = fromGoogleEvent(
      { id: "abc", summary: "Holiday", start: { date: "2026-11-26" }, end: { date: "2026-11-27" } },
      "America/New_York",
    );

    expect(fields).toMatchObject({
      startAt: new Date("2026-11-26T00:00:00Z"),
      endAt: null,
      isAllDay: true,
    });
  });

  it("gives a multi-day all-day event its last day as the end", () => {
    const fields = fromGoogleEvent(
      { id: "abc", start: { date: "2026-11-26" }, end: { date: "2026-11-29" } },
      "UTC",
    );

    expect(fields?.endAt).toEqual(new Date("2026-11-28T00:00:00Z"));
  });

  it("uses a placeholder title and nulls for missing text", () => {
    const fields = fromGoogleEvent({ id: "abc", start: { date: "2026-11-26" } }, "UTC");

    expect(fields).toMatchObject({ title: "(No title)", location: null, notes: null });
  });

  it("returns null for cancelled events and events with no start", () => {
    expect(
      fromGoogleEvent({ id: "a", status: "cancelled", start: { date: "2026-11-26" } }, "UTC"),
    ).toBeNull();
    expect(fromGoogleEvent({ id: "b" }, "UTC")).toBeNull();
  });
});

describe("toGoogleEventBody", () => {
  const timed = {
    title: "Gym",
    startAt: new Date("2026-11-18T09:00:00Z"),
    endAt: new Date("2026-11-18T10:00:00Z"),
    isAllDay: false,
    location: null,
    notes: null,
  };

  it("sends timed events as local time plus the user's time zone", () => {
    expect(toGoogleEventBody(timed, "America/New_York")).toEqual({
      summary: "Gym",
      location: "",
      description: "",
      start: { dateTime: "2026-11-18T09:00:00", timeZone: "America/New_York" },
      end: { dateTime: "2026-11-18T10:00:00", timeZone: "America/New_York" },
    });
  });

  it("gives events with no end 30 minutes", () => {
    const body = toGoogleEventBody({ ...timed, endAt: null }, "UTC");

    expect(body.end).toEqual({ dateTime: "2026-11-18T09:30:00", timeZone: "UTC" });
  });

  it("sends all-day events as dates, ending the day after the last day", () => {
    const body = toGoogleEventBody(
      {
        ...timed,
        isAllDay: true,
        startAt: new Date("2026-11-26T10:00:00Z"),
        endAt: new Date("2026-11-28T00:00:00Z"),
      },
      "UTC",
    );

    expect(body.start).toEqual({ date: "2026-11-26" });
    expect(body.end).toEqual({ date: "2026-11-29" });
  });

  it("round-trips through fromGoogleEvent unchanged", () => {
    const original = { ...timed, location: "Gym hall", notes: "Leg day" };
    const body = toGoogleEventBody(original, "America/New_York");
    // Google answers with the offset filled in.
    const fromGoogle = fromGoogleEvent(
      {
        id: "x",
        ...body,
        start: { dateTime: "2026-11-18T09:00:00-05:00" },
        end: { dateTime: "2026-11-18T10:00:00-05:00" },
      },
      "America/New_York",
    );

    expect(fromGoogle).toEqual(original);
  });
});

