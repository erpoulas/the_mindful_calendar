"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { revokeGoogleToken } from "@/lib/google-calendar";
import { deleteGoogleConnection } from "@/lib/google-connections";
import { syncGoogleCalendar } from "@/lib/google-sync";
import { getUserTimezoneWithFallback } from "@/lib/user-settings";

/**
 * Syncs the calendar range on screen with Google. The dashboard calls this
 * from the browser after it has already shown the page, so a slow Google
 * never holds up a click. Returns true when the page should redraw.
 */
export async function syncGoogleCalendarAction(range: { start: string; end: string }) {
  const start = new Date(range.start);
  const end = new Date(range.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;

  const userId = await getCurrentUserId();
  const timeZone = await getUserTimezoneWithFallback(db, userId);
  return syncGoogleCalendar(db, { userId, start, end, timeZone });
}

export async function disconnectGoogleCalendarAction() {
  const userId = await getCurrentUserId();
  const connection = await deleteGoogleConnection(db, userId);

  // Also cancel the token on Google's side, so it stops working everywhere.
  // Best effort: the connection is already gone from our side either way.
  if (connection) {
    await revokeGoogleToken(connection.refreshToken).catch((error) =>
      console.error("Could not revoke Google token", error),
    );
  }

  revalidatePath("/dashboard", "layout");
}
