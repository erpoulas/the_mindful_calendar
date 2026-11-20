import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncGoogleCalendar } from "@/lib/google-sync";
import { storedTimezone } from "@/lib/stored-reads";
import { forgetStoredFromRoute } from "@/lib/stored-results";

/**
 * Syncs the calendar range on screen with Google. The dashboard calls this
 * from the browser after the page is already showing (GoogleCalendarSync).
 *
 * It is a Route Handler rather than a server action on purpose: Next runs a
 * tab's server actions one at a time, so a sync that is busy talking to
 * Google would hold up every save, drag or delete made meanwhile. A plain
 * request like this one runs alongside them.
 *
 * Body: { start, end } as ISO strings. Answers { changed }, true when the
 * page should redraw.
 */
export async function POST(request: NextRequest) {
  const range = (await request.json().catch(() => null)) as { start?: unknown; end?: unknown } | null;
  const start = new Date(String(range?.start));
  const end = new Date(String(range?.end));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: "start and end must be dates" }, { status: 400 });
  }

  const userId = await getCurrentUserId();
  const timeZone = await storedTimezone(userId);
  const changed = await syncGoogleCalendar(db, { userId, start, end, timeZone });
  // Google's changes reach the events (and, when an event is deleted, the
  // journal entry written on it), so their stored copies are now out of date.
  if (changed) forgetStoredFromRoute(userId, ["events", "journals"]);
  return NextResponse.json({ changed });
}
