import { toWallClockDate } from "./wall-clock";

// Talks to Google's OAuth and Calendar APIs with plain fetch calls. Nothing
// here touches the database; see google-events.ts for the part that does.

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const GOOGLE_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

// Read-only for now (one-way view). Two-way sync will need the wider
// "calendar.events" scope, and users will reconnect once to grant it.
const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events.readonly";

// A safety cap so a broken nextPageToken can never loop forever.
const MAX_EVENT_PAGES = 10;

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

/** A raw event as Google's Calendar API returns it (only the fields we use). */
export type GoogleApiEvent = {
  id: string;
  status?: string;
  summary?: string;
  htmlLink?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
};

/** A Google event ready to draw on our calendar, in wall-clock time like our own events. */
export type GoogleCalendarItem = {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date | null;
  isAllDay: boolean;
  htmlLink: string | null;
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

/** Every event on the user's main Google calendar between two real moments. */
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
      orderBy: "startTime",
      maxResults: "250",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const response = await fetch(`${GOOGLE_EVENTS_URL}?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.status === 401) {
      throw new GoogleAuthError("Google rejected the access token");
    }
    if (!response.ok) {
      throw new Error(`Google events request failed (${response.status})`);
    }

    const body: { items?: GoogleApiEvent[]; nextPageToken?: string } = await response.json();
    events.push(...(body.items ?? []));
    pageToken = body.nextPageToken;
    if (!pageToken) break;
  }

  return events;
}

function toItemDate(time: { date?: string; dateTime?: string }, timeZone: string) {
  // All-day events carry a plain date ("2026-11-26"), which already is a
  // wall-clock date. Timed ones carry a real moment with an offset, so they
  // get converted to the user's wall clock like "now" does.
  if (time.date) return new Date(`${time.date}T00:00:00Z`);
  if (time.dateTime) return toWallClockDate(new Date(time.dateTime), timeZone);
  return null;
}

export function toGoogleCalendarItem(
  event: GoogleApiEvent,
  timeZone: string,
): GoogleCalendarItem | null {
  if (event.status === "cancelled" || !event.start) return null;
  const startAt = toItemDate(event.start, timeZone);
  if (!startAt) return null;

  return {
    // Prefixed so a Google id can never clash with one of our own event ids.
    id: `google:${event.id}`,
    title: event.summary?.trim() || "(No title)",
    startAt,
    endAt: event.end ? toItemDate(event.end, timeZone) : null,
    isAllDay: Boolean(event.start.date),
    htmlLink: event.htmlLink ?? null,
  };
}
