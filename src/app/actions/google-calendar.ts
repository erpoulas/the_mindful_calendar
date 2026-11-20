"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
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

  revalidatePath("/dashboard", "layout");
}
