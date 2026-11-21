"use server";

import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  scheduleDopamineItemNow,
  scheduleProjectTaskNow,
  scheduleQuickListItemNow,
} from "@/lib/schedule-now";
import { storedTimezone } from "@/lib/stored-reads";
import { forgetStoredAfterSave } from "@/lib/stored-results";
import { toWallClockDate } from "@/lib/wall-clock";

// The "Start now" buttons: each makes a 1-hour event, starting this minute,
// from one list item (see src/lib/schedule-now.ts).

/** This moment on the user's own clock, the way event times are stored. */
async function wallClockNow(userId: string) {
  return toWallClockDate(new Date(), await storedTimezone(userId));
}

export async function scheduleQuickListItemNowAction(itemId: string) {
  const userId = await getCurrentUserId();
  await scheduleQuickListItemNow(db, { userId, itemId, now: await wallClockNow(userId) });
  forgetStoredAfterSave(userId, ["events"]);
}

export async function scheduleProjectTaskNowAction(taskId: string) {
  const userId = await getCurrentUserId();
  await scheduleProjectTaskNow(db, { userId, taskId, now: await wallClockNow(userId) });
  forgetStoredAfterSave(userId, ["events"]);
}

export async function scheduleDopamineItemNowAction(itemId: string) {
  const userId = await getCurrentUserId();
  await scheduleDopamineItemNow(db, { userId, itemId, now: await wallClockNow(userId) });
  forgetStoredAfterSave(userId, ["events"]);
}
