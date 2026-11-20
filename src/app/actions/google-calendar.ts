"use server";

import { getCurrentUserId } from "@/lib/auth";
import { forgetStoredAfterSave } from "@/lib/stored-results";
import { db } from "@/lib/db";
import { revokeGoogleToken } from "@/lib/google-calendar";
import { deleteGoogleConnection } from "@/lib/google-connections";

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

  // Nothing stored holds the connection itself (it has sign-in tokens), but
  // the events shown were synced through it, and forgetting them also makes
  // this action send back a fresh page without the sync.
  forgetStoredAfterSave(userId, ["events"]);
}
