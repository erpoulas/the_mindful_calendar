import { toWallClockDate } from "./wall-clock";

// Talks to Google's OAuth and Calendar APIs with plain fetch calls, and
// converts between Google's event format and ours. Nothing here touches the
// database; see google-sync.ts for the part that does.

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const GOOGLE_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

// Read and write access to events (not to calendar settings or sharing).
const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

// A safety cap so a broken nextPageToken can never loop forever.
const MAX_EVENT_PAGES = 10;

const DAY_MS = 24 * 60 * 60 * 1000;
// Google needs an end time; our events may have none, which we draw as 30 minutes.
const DEFAULT_DURATION_MS = 30 * 60 * 1000;

/**
 * Google refused our credentials: the user revoked access, the refresh token
 * expired (after 7 days while the Google app is in "Testing" mode), or the
 * code was already used. The fix is always to connect again.
 */
export class GoogleAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleAuthError";
  }
}

type GoogleTime = { date?: string; dateTime?: string; timeZone?: string };

/** An event as Google's Calendar API sends and receives it (only the fields we use). */
export type GoogleApiEvent = {
  id: string;
  /** A version tag that changes every time the event is edited. */
  etag?: string;
  status?: string;
  /** When the event was last edited, as an ISO string. */
  updated?: string;
  summary?: string;
  location?: string;
  description?: string;
  /** One of Google's 11 event colors, "1" to "11". Unset = the calendar's color. */
  colorId?: string;
  start?: GoogleTime;
  end?: GoogleTime;
  /** A repeating event's rule, e.g. ["RRULE:FREQ=WEEKLY;BYDAY=MO,WE"]. */
  recurrence?: string[];
  /** On one time of a repeating event: the repeating event's id. */
  recurringEventId?: string;
};

/** The fields that sync both ways, in our format (wall-clock times). */
export type SyncedEventFields = {
  title: string;
  startAt: Date;
  endAt: Date | null;
  isAllDay: boolean;
  location: string | null;
  notes: string | null;
};

function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri };
}

function requireGoogleConfig() {
  const config = googleConfig();
  if (!config) {
    throw new Error("GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI must be set");
  }
  return config;
}

export function isGoogleCalendarConfigured(): boolean {
  return googleConfig() !== null;
}

// ---------------------------------------------------------------------------
// Connecting: OAuth tokens
// ---------------------------------------------------------------------------

/** The Google sign-in page the "Connect" button sends the user to. */
export function buildGoogleAuthUrl(state: string): string {
  const { clientId, redirectUri } = requireGoogleConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_CALENDAR_SCOPE,
    // "offline" + "consent" make Google hand out a refresh token every time,
    // including when the user reconnects.
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params}`;
}

type TokenResponse = { access_token: string; expires_in: number; refresh_token?: string };

async function requestTokens(params: Record<string, string>): Promise<TokenResponse> {
  const { clientId, clientSecret } = requireGoogleConfig();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...params }).toString(),
  });

  // 400/401 mean Google rejected the code or refresh token itself.
  if (response.status === 400 || response.status === 401) {
    throw new GoogleAuthError(`Google rejected the token request (${response.status})`);
  }
  if (!response.ok) {
    throw new Error(`Google token request failed (${response.status})`);
  }
  return response.json();
}

function expiryFrom(now: Date, expiresInSeconds: number) {
  return new Date(now.getTime() + expiresInSeconds * 1000);
}

/** Step two of connecting: trade the one-time code from the callback for tokens. */
export async function exchangeCodeForTokens(code: string, now = new Date()) {
  const { redirectUri } = requireGoogleConfig();
  const tokens = await requestTokens({
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });
  if (!tokens.refresh_token) {
    throw new Error("Google did not return a refresh token");
  }
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    accessTokenExpiresAt: expiryFrom(now, tokens.expires_in),
  };
}

export async function refreshAccessToken(refreshToken: string, now = new Date()) {
  const tokens = await requestTokens({ refresh_token: refreshToken, grant_type: "refresh_token" });
  return {
    accessToken: tokens.access_token,
    accessTokenExpiresAt: expiryFrom(now, tokens.expires_in),
  };
}

/** Tells Google to cancel a token. Best effort: disconnecting works even if this fails. */
export async function revokeGoogleToken(token: string) {
  await fetch(GOOGLE_REVOKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }).toString(),
  });
}

// ---------------------------------------------------------------------------
// Reading and writing events
// ---------------------------------------------------------------------------

async function googleRequest(
  accessToken: string,
  url: string,
  init: { method?: string; body?: unknown } = {},
): Promise<Response> {
  const headers: Record<string, string> = { Authorization: `Bearer ${accessToken}` };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(url, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (response.status === 401) {
    throw new GoogleAuthError("Google rejected the access token");
  }
  return response;
}

/** 404 Not Found / 410 Gone: the event doesn't exist (any more). */
function isGone(response: Response) {
  return response.status === 404 || response.status === 410;
}

function failure(action: string, response: Response) {
  return new Error(`Google ${action} failed (${response.status})`);
}

function eventUrl(googleEventId: string) {
  return `${GOOGLE_EVENTS_URL}/${encodeURIComponent(googleEventId)}`;
}

/**
 * Every event on the user's main Google calendar between two real moments,
 * including ones deleted recently (status "cancelled"), so the sync can
 * remove them from the app too.
 */
export async function fetchGoogleEvents(
  accessToken: string,
  range: { timeMin: Date; timeMax: Date },
): Promise<GoogleApiEvent[]> {
  const events: GoogleApiEvent[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < MAX_EVENT_PAGES; page++) {
    const params = new URLSearchParams({
      timeMin: range.timeMin.toISOString(),
      timeMax: range.timeMax.toISOString(),
      // Expand repeating events into one entry per occurrence.
      singleEvents: "true",
      showDeleted: "true",
      maxResults: "250",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const response = await googleRequest(accessToken, `${GOOGLE_EVENTS_URL}?${params}`);
    if (!response.ok) throw failure("events request", response);

    const body: { items?: GoogleApiEvent[]; nextPageToken?: string } = await response.json();
    events.push(...(body.items ?? []));
    pageToken = body.nextPageToken;
    if (!pageToken) break;
  }

  return events;
}

/** One event by id, or null when Google has no such event. */
export async function getGoogleEvent(
  accessToken: string,
  googleEventId: string,
): Promise<GoogleApiEvent | null> {
  const response = await googleRequest(accessToken, eventUrl(googleEventId));
  if (isGone(response)) return null;
  if (!response.ok) throw failure("event request", response);
  return response.json();
}

/**
 * Our event ids are UUIDs. Without the dashes they are valid Google event ids
 * (lowercase letters a-v and digits), so each of our events always maps to
 * the same Google id.
 */
export function googleEventIdFor(eventId: string) {
  return eventId.replace(/-/g, "").toLowerCase();
}

/**
 * Creates the event in Google under the id we choose. If an earlier attempt
 * already created it (say the page was reloaded mid-sync), Google answers 409
 * Conflict and the existing event is returned, so there's never a duplicate.
 */
export async function insertGoogleEvent(
  accessToken: string,
  googleEventId: string,
  body: Omit<GoogleApiEvent, "id">,
): Promise<GoogleApiEvent> {
  const response = await googleRequest(accessToken, GOOGLE_EVENTS_URL, {
    method: "POST",
    body: { ...body, id: googleEventId },
  });
  if (response.status === 409) {
    const existing = await getGoogleEvent(accessToken, googleEventId);
    if (existing) return existing;
  }
  if (!response.ok) throw failure("event create", response);
  return response.json();
}

/** Changes the given fields. Returns null if the event was deleted in Google meanwhile. */
export async function patchGoogleEvent(
  accessToken: string,
  googleEventId: string,
  body: Omit<GoogleApiEvent, "id">,
): Promise<GoogleApiEvent | null> {
  const response = await googleRequest(accessToken, eventUrl(googleEventId), {
    method: "PATCH",
    body,
  });
  if (isGone(response)) return null;
  if (!response.ok) throw failure("event update", response);
  return response.json();
}

/** Deletes the event. Already gone counts as success. */
export async function deleteGoogleEvent(accessToken: string, googleEventId: string) {
  const response = await googleRequest(accessToken, eventUrl(googleEventId), {
    method: "DELETE",
  });
  if (isGone(response)) return;
  if (!response.ok) throw failure("event delete", response);
}

// ---------------------------------------------------------------------------
// Converting between Google's format and ours
// ---------------------------------------------------------------------------

/** "2026-11-18T09:00:00": a stored wall-clock time as Google's local date-time text. */
function toGoogleDateTime(wallClock: Date) {
  return wallClock.toISOString().slice(0, 19);
}

function toGoogleDate(wallClock: Date) {
  return wallClock.toISOString().slice(0, 10);
}

/**
 * Turns a Google event into our fields, in the user's wall-clock time.
 * Returns null for cancelled events and ones with no usable start.
 */
export function fromGoogleEvent(event: GoogleApiEvent, timeZone: string): SyncedEventFields | null {
  if (event.status === "cancelled" || !event.start) return null;

  let startAt: Date;
  let endAt: Date | null = null;
  const isAllDay = Boolean(event.start.date);

  if (event.start.date) {
    // All-day: plain dates, already wall-clock. Google's end date is the day
    // *after* the last day; ours is the last day itself, or none for a
    // one-day event.
    startAt = new Date(`${event.start.date}T00:00:00Z`);
    if (event.end?.date) {
      const lastDay = new Date(new Date(`${event.end.date}T00:00:00Z`).getTime() - DAY_MS);
      if (lastDay > startAt) endAt = lastDay;
    }
  } else if (event.start.dateTime) {
    // Timed: real moments with an offset, converted to the user's wall clock.
    startAt = toWallClockDate(new Date(event.start.dateTime), timeZone);
    if (event.end?.dateTime) endAt = toWallClockDate(new Date(event.end.dateTime), timeZone);
  } else {
    return null;
  }

  return {
    title: event.summary?.trim() || "(No title)",
    startAt,
    endAt,
    isAllDay,
    location: event.location || null,
    notes: event.description || null,
  };
}

/**
 * Our event as the body Google expects. Timed events are sent as local
 * date-time text plus the user's time zone, so 9:00am stays 9:00am there.
 * Empty strings clear a location or description that was removed here.
 */
export function toGoogleEventBody(
  event: SyncedEventFields,
  timeZone: string,
): Omit<GoogleApiEvent, "id"> {
  let start: GoogleTime;
  let end: GoogleTime;

  if (event.isAllDay) {
    const lastDay = event.endAt && event.endAt > event.startAt ? event.endAt : event.startAt;
    start = { date: toGoogleDate(event.startAt) };
    // Google wants the day after the last day.
    end = { date: toGoogleDate(new Date(lastDay.getTime() + DAY_MS)) };
  } else {
    const endAt = event.endAt ?? new Date(event.startAt.getTime() + DEFAULT_DURATION_MS);
    start = { dateTime: toGoogleDateTime(event.startAt), timeZone };
    end = { dateTime: toGoogleDateTime(endAt), timeZone };
  }

  return {
    summary: event.title,
    location: event.location ?? "",
    description: event.notes ?? "",
    start,
    end,
  };
}
