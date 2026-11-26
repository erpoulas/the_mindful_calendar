import type { DbClient } from "./db";
import type { KeepAffirmationFor } from "./affirmation-schemas";
import { toWallClockDate } from "./wall-clock";

export async function addAffirmation(
  client: DbClient,
  data: { userId: string; text: string },
) {
  return client.affirmation.create({ data });
}

export async function listAffirmations(client: DbClient, userId: string) {
  return client.affirmation.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getRandomAffirmation(client: DbClient, userId: string) {
  const affirmations = await client.affirmation.findMany({ where: { userId } });
  if (affirmations.length === 0) return null;

  return affirmations[Math.floor(Math.random() * affirmations.length)];
}

export async function deleteAffirmation(
  client: DbClient,
  params: { userId: string; affirmationId: string },
) {
  const affirmation = await client.affirmation.findFirst({
    where: { id: params.affirmationId, userId: params.userId },
  });
  if (!affirmation) return null;

  await client.affirmation.delete({ where: { id: affirmation.id } });
  return affirmation;
}

export async function setTodayAffirmation(
  client: DbClient,
  params: { userId: string; text: string; keepUntil: Date | null },
) {
  const { userId, text, keepUntil } = params;
  return client.todayAffirmation.upsert({
    where: { userId },
    create: { userId, text, keepUntil },
    update: { text, keepUntil, setAt: new Date() },
  });
}

export async function clearTodayAffirmation(client: DbClient, userId: string) {
  await client.todayAffirmation.deleteMany({ where: { userId } });
}

/** Today's calendar day in `timeZone`, as midnight UTC (how keepUntil is stored). */
function todayIn(timeZone: string, now: Date) {
  const wallClock = toWallClockDate(now, timeZone);
  return new Date(
    Date.UTC(wallClock.getUTCFullYear(), wallClock.getUTCMonth(), wallClock.getUTCDate()),
  );
}

/** The last day an affirmation kept for `choice` shows; null keeps it until changed. */
export function keepAffirmationUntil(
  choice: KeepAffirmationFor,
  timeZone: string,
  now = new Date(),
): Date | null {
  const lastDay = todayIn(timeZone, now);
  if (choice === "forever") return null;
  if (choice === "week") lastDay.setUTCDate(lastDay.getUTCDate() + 6);
  if (choice === "month") {
    lastDay.setUTCMonth(lastDay.getUTCMonth() + 1);
    lastDay.setUTCDate(lastDay.getUTCDate() - 1);
  }
  return lastDay;
}

export async function getTodayAffirmation(
  client: DbClient,
  userId: string,
  timeZone = "UTC",
  now = new Date(),
): Promise<{ text: string; isOverride: boolean; keepUntil: Date | null } | null> {
  const override = await client.todayAffirmation.findUnique({ where: { userId } });
  if (override && (override.keepUntil === null || override.keepUntil >= todayIn(timeZone, now))) {
    return { text: override.text, isOverride: true, keepUntil: override.keepUntil };
  }

  const picked = await getRandomAffirmation(client, userId);
  return picked ? { text: picked.text, isOverride: false, keepUntil: null } : null;
}
