import type { DbClient } from "./db";
import {
  fetchGoogleEvents,
  GoogleAuthError,
  refreshAccessToken,
  toGoogleCalendarItem,
  type GoogleCalendarItem,
} from "./google-calendar";
import {
  deleteGoogleConnection,
  getGoogleConnection,
  saveGoogleAccessToken,
} from "./google-connections";
import { fromWallClockDate } from "./wall-clock";

// Refresh a little before the real expiry so a token never dies mid-request.
const EXPIRY_MARGIN_MS = 60 * 1000;

/**
 * The user's Google Calendar events between two wall-clock times (the same
 * kind of range the calendar views already use for our own events).
 *
 * Never throws: the calendar must still load if Google is slow or down, so
 * any failure just means no Google events this time. If Google says the
 * connection itself is dead, it is deleted so Account settings offers
 * "Connect" again.
 */
export async function getGoogleEventsForRange(
  client: DbClient,
  params: { userId: string; start: Date; end: Date; timeZone: string; now?: Date },
): Promise<GoogleCalendarItem[]> {
  const { userId, start, end, timeZone, now = new Date() } = params;
  const connection = await getGoogleConnection(client, userId);
  if (!connection) return [];

  const refresh = async () => {
    const tokens = await refreshAccessToken(connection.refreshToken, now);
    await saveGoogleAccessToken(client, { userId, ...tokens });
    return tokens.accessToken;
  };

  const range = {
    timeMin: fromWallClockDate(start, timeZone),
    timeMax: fromWallClockDate(end, timeZone),
  };

  try {
    const isExpired =
      connection.accessTokenExpiresAt.getTime() - EXPIRY_MARGIN_MS <= now.getTime();
    let accessToken = isExpired ? await refresh() : connection.accessToken;

    let events;
    try {
      events = await fetchGoogleEvents(accessToken, range);
    } catch (error) {
      // A stored token can be cancelled early; one fresh token is worth a try.
      if (!(error instanceof GoogleAuthError) || isExpired) throw error;
      accessToken = await refresh();
      events = await fetchGoogleEvents(accessToken, range);
    }

    return events
      .map((event) => toGoogleCalendarItem(event, timeZone))
      .filter((item): item is GoogleCalendarItem => item !== null)
      // Match our own events, which only show on the day they start.
      .filter((item) => item.startAt >= start && item.startAt < end);
  } catch (error) {
    if (error instanceof GoogleAuthError) {
      await deleteGoogleConnection(client, userId);
    } else {
      console.error("Could not load Google Calendar events", error);
    }
    return [];
  }
}
