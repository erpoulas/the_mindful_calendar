import type { DbClient } from "./db";
import {
  deleteGoogleEvent,
  fetchGoogleEvents,
  fromGoogleEvent,
  getGoogleEvent,
  googleEventIdFor,
  GoogleAuthError,
  insertGoogleEvent,
  patchGoogleEvent,
  refreshAccessToken,
  toGoogleEventBody,
  type GoogleApiEvent,
  type SyncedEventFields,
} from "./google-calendar";
import {
  deleteGoogleConnection,
  getGoogleConnection,
  saveGoogleAccessToken,
} from "./google-connections";
import { fromWallClockDate, toWallClockDate } from "./wall-clock";

// Two-way Google Calendar sync, run each time the calendar loads ("polling
// on app open", see project-summary.md). Each run:
//   1. deletes in Google the events deleted in the app since last time,
//   2. reconciles the range on screen: Google's new events come in, and
//      events changed on one side are copied to the other,
//   3. sends app edits made anywhere else (say, to an event next month),
//   4. sends app events that Google doesn't have yet.
//
// How "changed" is detected:
// - in Google: its etag (version tag) differs from the one we stored,
// - in the app: updatedAt is later than lastSyncedAt.
// If both changed, whichever was edited most recently wins.
//
// Intention and project links never leave the app, and journal events send
// only their title (which is the prompt), never the writing itself.

// Refresh a little before the real expiry so a token never dies mid-request.
const EXPIRY_MARGIN_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const withJournalFlag = { journalEntry: { select: { id: true } } } as const;

type SyncedRow = {
  id: string;
  title: string;
  startAt: Date | null;
  endAt: Date | null;
  isAllDay: boolean;
  location: string | null;
  notes: string | null;
  googleEventId: string | null;
  googleEtag: string | null;
  lastSyncedAt: Date | null;
  updatedAt: Date;
  journalEntry: { id: string } | null;
};

type GoogleCall = <T>(request: (accessToken: string) => Promise<T>) => Promise<T>;

/**
 * Syncs the user's main Google calendar with the app, looking closely at
 * the wall-clock range on screen. Never throws: if Google is down the
 * calendar still loads from our own data. If Google has rejected the
 * connection it is deleted, so Account settings offers "Connect" again.
 *
 * Returns true when the sync changed what the app shows (an event came in,
 * changed or went away, or the connection was dropped), so the dashboard
 * knows to redraw. Sending app events to Google returns false: the app
 * already shows them.
 */
export async function syncGoogleCalendar(
  client: DbClient,
  params: { userId: string; start: Date; end: Date; timeZone: string; now?: Date },
): Promise<boolean> {
  const { userId, timeZone, now = new Date() } = params;
  const connection = await getGoogleConnection(client, userId);
  if (!connection) return false;

  const sync = new GoogleSync(client, userId, timeZone, now, createGoogleCall(client, connection, now));
  try {
    await sync.pushDeletions();
    await sync.reconcileRange(params.start, params.end);
    await sync.pushChangedEvents();
    // "From today on": events from the day the user connected onwards, plus
    // any event created after connecting, wherever it sits.
    const connectedDay = startOfDay(toWallClockDate(connection.connectedAt, timeZone));
    await sync.pushNewEvents({ connectedAt: connection.connectedAt, connectedDay });
  } catch (error) {
    if (error instanceof GoogleAuthError) {
      await deleteGoogleConnection(client, userId);
      return true;
    }
    console.error("Google Calendar sync failed", error);
  }
  return sync.changedAppEvents;
}

/**
 * Synced events are stored as wall-clock times in the user's main zone, so
 * after that zone changes they sit hours off. Forgetting their Google
 * version tag makes the next sync see them as changed in Google and read
 * them again in the new zone. updatedAt moves with lastSyncedAt so they
 * don't also look edited in the app (which would push the old times to
 * Google). Events with app edits not yet sent are left alone.
 */
export async function markGoogleEventsForReread(client: DbClient, userId: string, now = new Date()) {
  await client.calendarEvent.updateMany({
    where: {
      userId,
      googleEventId: { not: null },
      updatedAt: { lte: client.calendarEvent.fields.lastSyncedAt },
    },
    data: { googleEtag: null, lastSyncedAt: now, updatedAt: now },
  });
}

function startOfDay(wallClock: Date) {
  return new Date(Math.floor(wallClock.getTime() / DAY_MS) * DAY_MS);
}

/**
 * Wraps each request to Google with a valid access token: refreshes an
 * expired one first, and if Google still rejects a token that looked fine
 * (it can be cancelled early), refreshes once and retries.
 */
function createGoogleCall(
  client: DbClient,
  connection: { userId: string; refreshToken: string; accessToken: string; accessTokenExpiresAt: Date },
  now: Date,
): GoogleCall {
  let accessToken = connection.accessToken;
  let needsRefresh = connection.accessTokenExpiresAt.getTime() - EXPIRY_MARGIN_MS <= now.getTime();
  let refreshed = false;

  const refresh = async () => {
    const tokens = await refreshAccessToken(connection.refreshToken, now);
    await saveGoogleAccessToken(client, { userId: connection.userId, ...tokens });
    accessToken = tokens.accessToken;
    needsRefresh = false;
    refreshed = true;
  };

  return async (request) => {
    if (needsRefresh) await refresh();
    try {
      return await request(accessToken);
    } catch (error) {
      if (!(error instanceof GoogleAuthError) || refreshed) throw error;
      await refresh();
      return request(accessToken);
    }
  };
}

class GoogleSync {
  /** Set once an app event is created, changed or deleted from Google's side. */
  changedAppEvents = false;

  constructor(
    private client: DbClient,
    private userId: string,
    private timeZone: string,
    private now: Date,
    private google: GoogleCall,
  ) {}

  /** Step 1. Must run first, or step 2 would bring the deleted events back. */
  async pushDeletions() {
    const deletions = await this.client.googleEventDeletion.findMany({
      where: { userId: this.userId },
    });
    for (const { googleEventId } of deletions) {
      await this.google((token) => deleteGoogleEvent(token, googleEventId));
      await this.client.googleEventDeletion.delete({ where: { googleEventId } });
    }
  }

  /** Step 2. */
  async reconcileRange(start: Date, end: Date) {
    const googleEvents = await this.google((token) =>
      fetchGoogleEvents(token, {
        timeMin: fromWallClockDate(start, this.timeZone),
        timeMax: fromWallClockDate(end, this.timeZone),
      }),
    );
    const googleIds = new Set(googleEvents.map((event) => event.id));

    // Our synced rows in the range, plus rows for any event Google returned
    // (they may sit elsewhere here if the event was moved in Google).
    const rows: SyncedRow[] = await this.client.calendarEvent.findMany({
      where: {
        userId: this.userId,
        OR: [
          { startAt: { gte: start, lt: end }, googleEventId: { not: null } },
          { googleEventId: { in: [...googleIds] } },
        ],
      },
      include: withJournalFlag,
    });
    const rowsByGoogleId = new Map(rows.map((row) => [row.googleEventId!, row]));

    for (const googleEvent of googleEvents) {
      await this.reconcile(rowsByGoogleId.get(googleEvent.id) ?? null, googleEvent);
    }

    // A synced row in the range that Google didn't list was either moved out
    // of the range in Google or deleted there. Ask Google which.
    for (const row of rows) {
      if (googleIds.has(row.googleEventId!)) continue;
      const googleEvent = await this.google((token) => getGoogleEvent(token, row.googleEventId!));
      await this.reconcile(row, googleEvent);
    }
  }

  /** Step 3: synced events edited in the app since their last sync, wherever they are. */
  async pushChangedEvents() {
    const rows: SyncedRow[] = await this.client.calendarEvent.findMany({
      where: {
        userId: this.userId,
        googleEventId: { not: null },
        updatedAt: { gt: this.client.calendarEvent.fields.lastSyncedAt },
      },
      include: withJournalFlag,
    });
    for (const row of rows) {
      // Fetch Google's copy first, in case it changed there too.
      const googleEvent = await this.google((token) => getGoogleEvent(token, row.googleEventId!));
      await this.reconcile(row, googleEvent);
    }
  }

  /** Step 4. Events synced once and then unlinked (lastSyncedAt set) are skipped. */
  async pushNewEvents(eligible: { connectedAt: Date; connectedDay: Date }) {
    const rows: SyncedRow[] = await this.client.calendarEvent.findMany({
      where: {
        userId: this.userId,
        googleEventId: null,
        lastSyncedAt: null,
        startAt: { not: null },
        OR: [{ startAt: { gte: eligible.connectedDay } }, { createdAt: { gte: eligible.connectedAt } }],
      },
      include: withJournalFlag,
    });
    for (const row of rows) {
      const googleEventId = googleEventIdFor(row.id);
      const created = await this.google((token) =>
        insertGoogleEvent(token, googleEventId, this.toGoogleBody(row)),
      );
      await this.markSynced(row.id, { googleEventId: created.id, googleEtag: created.etag ?? null });
    }
  }

  /** Brings one row and its Google event (or the lack of one) into agreement. */
  private async reconcile(row: SyncedRow | null, googleEvent: GoogleApiEvent | null) {
    const fields = googleEvent ? fromGoogleEvent(googleEvent, this.timeZone) : null;

    if (!fields) {
      // Deleted (or never usable) in Google.
      if (row) await this.removeDeletedInGoogle(row);
      return;
    }

    if (!row) {
      this.changedAppEvents = true;
      await this.client.calendarEvent.create({
        data: {
          userId: this.userId,
          ...fields,
          googleEventId: googleEvent!.id,
          googleEtag: googleEvent!.etag ?? null,
          lastSyncedAt: this.now,
          updatedAt: this.now,
        },
      });
      return;
    }

    const changedInGoogle = googleEvent!.etag !== row.googleEtag;
    const changedInApp = row.lastSyncedAt === null || row.updatedAt > row.lastSyncedAt;
    if (!changedInGoogle && !changedInApp) return;

    const googleEditedAt = new Date(googleEvent!.updated ?? 0);
    const googleWins = changedInGoogle && (!changedInApp || googleEditedAt > row.updatedAt);

    if (googleWins) {
      this.changedAppEvents = true;
      await this.markSynced(row.id, {
        ...fields,
        // A journal event's notes never came from Google, so don't take them from there.
        notes: row.journalEntry ? row.notes : fields.notes,
        googleEtag: googleEvent!.etag ?? null,
      });
    } else {
      await this.pushRow(row);
    }
  }

  private async pushRow(row: SyncedRow) {
    if (!row.startAt) return; // Google can't hold an event with no time
    const updated = await this.google((token) =>
      patchGoogleEvent(token, row.googleEventId!, this.toGoogleBody(row)),
    );
    if (!updated) {
      await this.removeDeletedInGoogle(row);
      return;
    }
    await this.markSynced(row.id, { googleEtag: updated.etag ?? null });
  }

  /**
   * The event was deleted in Google, so delete it here too. A journal
   * event is only unlinked instead: deleting it would also delete the
   * private journal writing, which Google never had.
   */
  private async removeDeletedInGoogle(row: SyncedRow) {
    this.changedAppEvents = true;
    if (row.journalEntry) {
      await this.markSynced(row.id, { googleEventId: null, googleEtag: null });
    } else {
      await this.client.calendarEvent.delete({ where: { id: row.id } });
    }
  }

  /**
   * Saves a sync result. updatedAt is set to the same moment as
   * lastSyncedAt, so the row doesn't look edited-in-the-app afterwards.
   */
  private async markSynced(
    eventId: string,
    data: Partial<SyncedEventFields> & { googleEventId?: string | null; googleEtag?: string | null },
  ) {
    await this.client.calendarEvent.update({
      where: { id: eventId },
      data: { ...data, lastSyncedAt: this.now, updatedAt: this.now },
    });
  }

  private toGoogleBody(row: SyncedRow) {
    return toGoogleEventBody(
      {
        title: row.title,
        startAt: row.startAt!,
        endAt: row.endAt,
        isAllDay: row.isAllDay,
        location: row.location,
        // Journal events: title (the prompt) only. Never the writing.
        notes: row.journalEntry ? null : row.notes,
      },
      this.timeZone,
    );
  }
}
