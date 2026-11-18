import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { withRollback } from "@/test/withRollback";
import type { DbClient } from "@/lib/db";
import { createCalendarEvent, deleteCalendarEvent } from "@/lib/calendar-events";
import type { GoogleApiEvent } from "@/lib/google-calendar";
import { getGoogleConnection, saveGoogleConnection } from "@/lib/google-connections";
import { markGoogleEventsForReread, syncGoogleCalendar } from "@/lib/google-sync";
import { createJournal, createJournalEntry } from "@/lib/journals";

const USER = "test-user-1";
const TIME_ZONE = "America/New_York";
const NOW = new Date("2026-11-18T12:00:00Z");
const CONNECTED_AT = new Date("2026-11-10T15:00:00Z");
const LAST_SYNC = new Date("2026-11-12T00:00:00Z");
// The week on screen, as wall-clock times: Mon 16 Nov to Mon 23 Nov.
const WEEK = { start: new Date("2026-11-16T00:00:00Z"), end: new Date("2026-11-23T00:00:00Z") };

const EVENTS_PATH = "/calendar/v3/calendars/primary/events";

/**
 * A tiny in-memory stand-in for Google Calendar, answering the same
 * requests the real API does, so the sync can be tested end to end.
 */
class FakeGoogle {
  events = new Map<string, GoogleApiEvent>();
  requests: string[] = [];
  /** When set, every request fails with this HTTP status. */
  failWith: number | null = null;
  private version = 0;

  /** Adds or replaces an event "edited in Google" at `updated`. */
  put(event: GoogleApiEvent, updated = "2026-11-15T00:00:00Z") {
    const stored = { status: "confirmed", ...event, etag: `"v${++this.version}"`, updated };
    this.events.set(event.id, stored);
    return stored;
  }

  fetch = vi.fn(async (input: string, init: RequestInit = {}) => {
    const url = new URL(input);
    const method = init.method ?? "GET";
    this.requests.push(`${method} ${url.pathname.replace(EVENTS_PATH, "/events")}`);
    if (this.failWith) return json({}, this.failWith);

    if (url.hostname === "oauth2.googleapis.com") {
      return json({ access_token: "fresh-access", expires_in: 3600 });
    }

    const id = url.pathname.startsWith(`${EVENTS_PATH}/`)
      ? decodeURIComponent(url.pathname.slice(EVENTS_PATH.length + 1))
      : null;
    const body = init.body ? JSON.parse(String(init.body)) : undefined;

    if (!id && method === "GET") {
      const timeMin = new Date(url.searchParams.get("timeMin")!);
      const timeMax = new Date(url.searchParams.get("timeMax")!);
      const items = [...this.events.values()].filter((event) => {
        const start = new Date(event.start?.dateTime ?? `${event.start?.date}T00:00:00Z`);
        return start >= timeMin && start < timeMax;
      });
      return json({ items });
    }
    if (!id && method === "POST") {
      if (this.events.has(body.id)) return json({}, 409);
      return json(this.put(body, NOW.toISOString()));
    }

    const existing = id ? this.events.get(id) : undefined;
    if (!existing || existing.status === "cancelled") return json({}, existing ? 410 : 404);
    if (method === "GET") return json(existing);
    if (method === "PATCH") return json(this.put({ ...existing, ...body }, NOW.toISOString()));
    if (method === "DELETE") {
      this.put({ ...existing, status: "cancelled" }, NOW.toISOString());
      return new Response(null, { status: 204 });
    }
    return json({}, 400);
  });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

let google: FakeGoogle;

beforeEach(() => {
  vi.stubEnv("GOOGLE_CLIENT_ID", "test-client-id");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-client-secret");
  vi.stubEnv("GOOGLE_REDIRECT_URI", "http://localhost:3000/auth/google/callback");
  vi.spyOn(console, "error").mockImplementation(() => {});
  google = new FakeGoogle();
  vi.stubGlobal("fetch", google.fetch);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function connect(tx: DbClient, accessTokenExpiresAt = new Date("2026-11-18T13:00:00Z")) {
  await saveGoogleConnection(tx, {
    userId: USER,
    refreshToken: "refresh-1",
    accessToken: "access-1",
    accessTokenExpiresAt,
  });
  await tx.googleConnection.update({ where: { userId: USER }, data: { connectedAt: CONNECTED_AT } });
}

function sync(tx: DbClient) {
  return syncGoogleCalendar(tx, { userId: USER, ...WEEK, timeZone: TIME_ZONE, now: NOW });
}

/** A Google event at 9-10am New York time on the given day. */
function googleEvent(id: string, day: string, extra: Partial<GoogleApiEvent> = {}): GoogleApiEvent {
  return {
    id,
    summary: "Dentist",
    start: { dateTime: `${day}T09:00:00-05:00` },
    end: { dateTime: `${day}T10:00:00-05:00` },
    ...extra,
  };
}

/** An app row already linked to a Google event, last synced at LAST_SYNC. */
async function linkedRow(
  tx: DbClient,
  stored: GoogleApiEvent,
  data: { title?: string; updatedAt?: Date; startAt?: Date } = {},
) {
  return tx.calendarEvent.create({
    data: {
      userId: USER,
      title: data.title ?? stored.summary ?? "",
      startAt: data.startAt ?? new Date(`${stored.start!.dateTime!.slice(0, 19)}Z`),
      endAt: new Date(`${stored.end!.dateTime!.slice(0, 19)}Z`),
      googleEventId: stored.id,
      googleEtag: stored.etag,
      lastSyncedAt: LAST_SYNC,
      updatedAt: data.updatedAt ?? LAST_SYNC,
      createdAt: new Date("2026-11-01T00:00:00Z"),
    },
  });
}

function findRow(tx: DbClient, googleEventId: string) {
  return tx.calendarEvent.findUnique({ where: { googleEventId } });
}

describe("syncGoogleCalendar", () => {
  it("does nothing, without calling Google, when the user never connected", async () => {
    await withRollback(async (tx) => {
      await sync(tx);
    });
    expect(google.fetch).not.toHaveBeenCalled();
  });

  describe("bringing Google's changes into the app", () => {
    it("imports a new Google event in the week, in wall-clock time", async () => {
      google.put(googleEvent("dentist", "2026-11-18", { location: "Main St" }));

      await withRollback(async (tx) => {
        await connect(tx);
        await sync(tx);

        const row = await findRow(tx, "dentist");
        expect(row).toMatchObject({
          userId: USER,
          title: "Dentist",
          startAt: new Date("2026-11-18T09:00:00Z"),
          endAt: new Date("2026-11-18T10:00:00Z"),
          location: "Main St",
          lastSyncedAt: NOW,
        });
      });
    });

    it("doesn't import a second copy on the next sync", async () => {
      google.put(googleEvent("dentist", "2026-11-18"));

      await withRollback(async (tx) => {
        await connect(tx);
        await sync(tx);
        await sync(tx);

        expect(await tx.calendarEvent.count({ where: { userId: USER } })).toBe(1);
      });
    });

    it("copies a Google edit into the app, keeping the app-only intention links", async () => {
      const original = google.put(googleEvent("dentist", "2026-11-18"));

      await withRollback(async (tx) => {
        await connect(tx);
        const row = await linkedRow(tx, original);
        const intention = await tx.intention.create({ data: { userId: USER, name: "Health" } });
        await tx.eventIntention.create({ data: { eventId: row.id, intentionId: intention.id } });
        google.put(googleEvent("dentist", "2026-11-19", { summary: "Dentist (moved)" }));

        await sync(tx);

        const updated = await tx.calendarEvent.findUnique({
          where: { id: row.id },
          include: { intentions: true },
        });
        expect(updated?.title).toBe("Dentist (moved)");
        expect(updated?.startAt).toEqual(new Date("2026-11-19T09:00:00Z"));
        expect(updated?.intentions).toHaveLength(1);
      });
    });

    it("deletes an event that was deleted in Google", async () => {
      const original = google.put(googleEvent("dentist", "2026-11-18"));

      await withRollback(async (tx) => {
        await connect(tx);
        await linkedRow(tx, original);
        google.put({ ...original, status: "cancelled" });

        await sync(tx);

        expect(await findRow(tx, "dentist")).toBeNull();
      });
    });

    it("finds an event Google no longer lists in the week: moved away, so it follows", async () => {
      const original = google.put(googleEvent("dentist", "2026-11-18"));

      await withRollback(async (tx) => {
        await connect(tx);
        await linkedRow(tx, original);
        google.put(googleEvent("dentist", "2026-12-02"));

        await sync(tx);

        expect((await findRow(tx, "dentist"))?.startAt).toEqual(new Date("2026-12-02T09:00:00Z"));
      });
    });

    it("finds an event Google no longer lists in the week: gone, so it is deleted", async () => {
      const original = google.put(googleEvent("dentist", "2026-11-18"));

      await withRollback(async (tx) => {
        await connect(tx);
        await linkedRow(tx, original);
        google.events.clear();

        await sync(tx);

        expect(await findRow(tx, "dentist")).toBeNull();
      });
    });

    it("keeps a journal entry whose event was deleted in Google, and stops syncing it", async () => {
      await withRollback(async (tx) => {
        await connect(tx);
        const journal = await createJournal(tx, { userId: USER, name: "Gratitude" });
        const entry = await createJournalEntry(tx, {
          userId: USER,
          journalId: journal.id,
          promptText: "What went well?",
          content: "Private writing",
          startAt: new Date("2026-11-18T20:00:00Z"),
        });
        await sync(tx); // sends the journal event to Google
        const sent = await tx.calendarEvent.findUniqueOrThrow({ where: { id: entry!.calendarEventId } });
        google.put({ ...google.events.get(sent.googleEventId!)!, status: "cancelled" });

        await sync(tx);
        await sync(tx);

        const kept = await tx.journalEntry.findUnique({ where: { id: entry!.id } });
        expect(kept?.content).toBe("Private writing");
        const event = await tx.calendarEvent.findUniqueOrThrow({ where: { id: entry!.calendarEventId } });
        expect(event.googleEventId).toBeNull();
        // Not sent to Google a second time.
        expect(google.requests.filter((request) => request.startsWith("POST /events"))).toHaveLength(1);
      });
    });
  });

  describe("sending app changes to Google", () => {
    it("sends an app edit to Google", async () => {
      const original = google.put(googleEvent("dentist", "2026-11-18"));

      await withRollback(async (tx) => {
        await connect(tx);
        await linkedRow(tx, original, {
          title: "Dentist, renamed here",
          updatedAt: new Date("2026-11-16T00:00:00Z"),
        });

        await sync(tx);

        expect(google.events.get("dentist")?.summary).toBe("Dentist, renamed here");
        const row = await findRow(tx, "dentist");
        expect(row?.googleEtag).toBe(google.events.get("dentist")?.etag);
        expect(row?.lastSyncedAt).toEqual(NOW);
      });
    });

    it("sends an app edit to an event outside the week on screen", async () => {
      const original = google.put(googleEvent("party", "2026-12-12"));

      await withRollback(async (tx) => {
        await connect(tx);
        await linkedRow(tx, original, { title: "Party!", updatedAt: new Date("2026-11-16T00:00:00Z") });

        await sync(tx);

        expect(google.events.get("party")?.summary).toBe("Party!");
      });
    });

    it("when both sides changed, the most recent edit wins: Google's", async () => {
      const original = google.put(googleEvent("dentist", "2026-11-18"));

      await withRollback(async (tx) => {
        await connect(tx);
        await linkedRow(tx, original, { title: "App title", updatedAt: new Date("2026-11-13T00:00:00Z") });
        google.put(googleEvent("dentist", "2026-11-18", { summary: "Google title" }), "2026-11-14T00:00:00Z");

        await sync(tx);

        expect((await findRow(tx, "dentist"))?.title).toBe("Google title");
        expect(google.events.get("dentist")?.summary).toBe("Google title");
      });
    });

    it("when both sides changed, the most recent edit wins: the app's", async () => {
      const original = google.put(googleEvent("dentist", "2026-11-18"));

      await withRollback(async (tx) => {
        await connect(tx);
        await linkedRow(tx, original, { title: "App title", updatedAt: new Date("2026-11-15T00:00:00Z") });
        google.put(googleEvent("dentist", "2026-11-18", { summary: "Google title" }), "2026-11-14T00:00:00Z");

        await sync(tx);

        expect((await findRow(tx, "dentist"))?.title).toBe("App title");
        expect(google.events.get("dentist")?.summary).toBe("App title");
      });
    });

    it("sends nothing when neither side changed", async () => {
      const original = google.put(googleEvent("dentist", "2026-11-18"));

      await withRollback(async (tx) => {
        await connect(tx);
        await linkedRow(tx, original);

        await sync(tx);

        expect(google.requests).toEqual(["GET /events"]);
      });
    });

    it("deletes in Google an event deleted in the app, and doesn't bring it back", async () => {
      const original = google.put(googleEvent("dentist", "2026-11-18"));

      await withRollback(async (tx) => {
        await connect(tx);
        const row = await linkedRow(tx, original);
        await deleteCalendarEvent(tx, { userId: USER, eventId: row.id });

        await sync(tx);

        expect(google.events.get("dentist")?.status).toBe("cancelled");
        expect(await findRow(tx, "dentist")).toBeNull();
        expect(await tx.googleEventDeletion.count({ where: { userId: USER } })).toBe(0);
      });
    });

    it("keeps an app deletion for the next sync when Google is down", async () => {
      const original = google.put(googleEvent("dentist", "2026-11-18"));

      await withRollback(async (tx) => {
        await connect(tx);
        const row = await linkedRow(tx, original);
        await deleteCalendarEvent(tx, { userId: USER, eventId: row.id });
        google.failWith = 503;

        await sync(tx);

        expect(await tx.googleEventDeletion.count({ where: { userId: USER } })).toBe(1);
      });
    });
  });

  describe("sending new app events to Google", () => {
    it("sends upcoming events, under an id derived from ours", async () => {
      await withRollback(async (tx) => {
        await connect(tx);
        const event = await createCalendarEvent(tx, {
          userId: USER,
          title: "Gym",
          startAt: new Date("2026-11-20T07:00:00Z"),
          notes: "Leg day",
        });

        await sync(tx);

        const googleId = event.id.replace(/-/g, "");
        expect(google.events.get(googleId)).toMatchObject({
          summary: "Gym",
          description: "Leg day",
          start: { dateTime: "2026-11-20T07:00:00", timeZone: TIME_ZONE },
        });
        expect((await tx.calendarEvent.findUnique({ where: { id: event.id } }))?.googleEventId).toBe(
          googleId,
        );
      });
    });

    it("sends upcoming events outside the week on screen too", async () => {
      await withRollback(async (tx) => {
        await connect(tx);
        await createCalendarEvent(tx, {
          userId: USER,
          title: "New Year",
          startAt: new Date("2027-01-01T00:00:00Z"),
        });

        await sync(tx);

        expect([...google.events.values()].map((event) => event.summary)).toEqual(["New Year"]);
      });
    });

    it("leaves past events created before connecting in the app only", async () => {
      await withRollback(async (tx) => {
        await connect(tx);
        await tx.calendarEvent.create({
          data: {
            userId: USER,
            title: "Old test event",
            startAt: new Date("2026-10-01T09:00:00Z"),
            createdAt: new Date("2026-10-01T00:00:00Z"),
          },
        });

        await sync(tx);

        expect(google.events.size).toBe(0);
      });
    });

    it("sends a past event created after connecting", async () => {
      await withRollback(async (tx) => {
        await connect(tx);
        await createCalendarEvent(tx, {
          userId: USER,
          title: "Logged afterwards",
          startAt: new Date("2026-11-01T09:00:00Z"),
        });

        await sync(tx);

        expect(google.events.size).toBe(1);
      });
    });

    it("sends a journal event's title (the prompt) but never the writing", async () => {
      await withRollback(async (tx) => {
        await connect(tx);
        const journal = await createJournal(tx, { userId: USER, name: "Gratitude" });
        await createJournalEntry(tx, {
          userId: USER,
          journalId: journal.id,
          promptText: "What went well?",
          content: "Private writing",
          startAt: new Date("2026-11-18T20:00:00Z"),
        });

        await sync(tx);

        const [sent] = [...google.events.values()];
        expect(sent.summary).toBe("What went well?");
        expect(sent.description).toBe("");
        expect(JSON.stringify(sent)).not.toContain("Private writing");
      });
    });

    it("skips events with no time, which Google can't hold", async () => {
      await withRollback(async (tx) => {
        await connect(tx);
        await createCalendarEvent(tx, { userId: USER, title: "Someday" });

        await sync(tx);

        expect(google.events.size).toBe(0);
      });
    });
  });

  describe("tokens and failures", () => {
    it("refreshes an expired access token and saves it", async () => {
      await withRollback(async (tx) => {
        await connect(tx, new Date("2026-11-18T11:00:00Z"));

        await sync(tx);

        expect(google.requests[0]).toBe("POST /token");
        expect((await getGoogleConnection(tx, USER))?.accessToken).toBe("fresh-access");
      });
    });

    it("forgets the connection when Google rejects it, so the user can reconnect", async () => {
      google.failWith = 401;

      await withRollback(async (tx) => {
        await connect(tx);

        await sync(tx);

        expect(await getGoogleConnection(tx, USER)).toBeNull();
      });
    });

    it("keeps the connection and doesn't throw when Google is down", async () => {
      google.failWith = 503;

      await withRollback(async (tx) => {
        await connect(tx);

        await expect(sync(tx)).resolves.toBeUndefined();
        expect(await getGoogleConnection(tx, USER)).not.toBeNull();
      });
    });
  });
});

describe("markGoogleEventsForReread", () => {
  it("makes the next sync re-read the event from Google in the new time zone", async () => {
    await withRollback(async (tx) => {
      await connect(tx);
      const stored = google.put(googleEvent("walk", "2026-11-18"));
      // Imported while the main zone was UTC: 9am New York saved as 14:00.
      await linkedRow(tx, stored, { startAt: new Date("2026-11-18T14:00:00Z") });

      await markGoogleEventsForReread(tx, USER, NOW);
      await sync(tx);

      const row = await findRow(tx, "walk");
      expect(row?.startAt).toEqual(new Date("2026-11-18T09:00:00Z"));
      expect(google.requests).not.toContain("PATCH /events/walk");
    });
  });

  it("leaves events with app edits not yet sent to Google alone", async () => {
    await withRollback(async (tx) => {
      const stored = google.put(googleEvent("walk", "2026-11-18"));
      await linkedRow(tx, stored, { updatedAt: new Date("2026-11-13T00:00:00Z") });

      await markGoogleEventsForReread(tx, USER, NOW);

      const row = await findRow(tx, "walk");
      expect(row?.googleEtag).toBe(stored.etag);
      expect(row?.updatedAt).toEqual(new Date("2026-11-13T00:00:00Z"));
    });
  });

  it("never touches another user's events", async () => {
    await withRollback(async (tx) => {
      const stored = google.put(googleEvent("walk", "2026-11-18"));
      await linkedRow(tx, stored);

      await markGoogleEventsForReread(tx, "test-user-2", NOW);

      expect((await findRow(tx, "walk"))?.googleEtag).toBe(stored.etag);
    });
  });
});
