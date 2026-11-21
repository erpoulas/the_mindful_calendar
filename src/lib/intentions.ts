import type { DbClient } from "./db";
import { getWeeklyEventCounts } from "./streak";

export async function createIntention(
  client: DbClient,
  data: { userId: string; name: string; color?: string },
) {
  return client.intention.create({ data });
}

// Every journal entry ties to this intention automatically, with zero setup
// required from the user -- created lazily on first use.
export async function getOrCreateJournalIntention(client: DbClient, userId: string) {
  const existing = await client.intention.findFirst({ where: { userId, isSystem: true } });
  if (existing) return existing;

  return client.intention.create({ data: { userId, name: "Journal", isSystem: true } });
}

export async function listIntentions(client: DbClient, userId: string) {
  return client.intention.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function updateIntention(
  client: DbClient,
  params: { userId: string; intentionId: string; name: string; color?: string },
) {
  const intention = await client.intention.findFirst({
    where: { id: params.intentionId, userId: params.userId },
  });
  if (!intention) return null;

  const color = params.color ?? null;
  const updated = await client.intention.update({
    where: { id: intention.id },
    data: { name: params.name, color },
  });

  if (color !== intention.color) await resendEventsToGoogle(client, params.userId, intention.id);

  return updated;
}

/**
 * Changes only an intention's color (null for none). Unlike updateIntention,
 * this also works on the automatic Journal intention: its name and existence
 * are fixed, but its color is the user's choice.
 */
export async function setIntentionColor(
  client: DbClient,
  params: { userId: string; intentionId: string; color: string | null },
) {
  const intention = await client.intention.findFirst({
    where: { id: params.intentionId, userId: params.userId },
  });
  if (!intention) return null;

  const updated = await client.intention.update({
    where: { id: intention.id },
    data: { color: params.color },
  });

  if (params.color !== intention.color) {
    await resendEventsToGoogle(client, params.userId, intention.id);
  }

  return updated;
}

// Events take their color from the intention when drawn, so the app already
// shows a new color. Google holds its own copy, so mark the synced events as
// edited: the next sync sends them with the new color.
async function resendEventsToGoogle(client: DbClient, userId: string, intentionId: string) {
  await client.calendarEvent.updateMany({
    where: {
      userId,
      googleEventId: { not: null },
      intentions: { some: { intentionId } },
    },
    data: { updatedAt: new Date() },
  });
}

export async function deleteIntention(
  client: DbClient,
  params: { userId: string; intentionId: string },
) {
  const intention = await client.intention.findFirst({
    where: { id: params.intentionId, userId: params.userId },
  });
  if (!intention) return null;

  if (intention.isSystem) {
    throw new Error("The automatic Journal intention can't be deleted");
  }

  await client.intention.delete({ where: { id: intention.id } });
  return intention;
}

export async function getIntentionDetail(
  client: DbClient,
  params: {
    userId: string;
    intentionId: string;
    referenceDate: Date;
    weekCount?: number;
  },
) {
  const intention = await client.intention.findFirst({
    where: { id: params.intentionId, userId: params.userId },
  });
  if (!intention) return null;

  const events = await client.calendarEvent.findMany({
    where: {
      userId: params.userId,
      projectId: null,
      intentions: { some: { intentionId: params.intentionId } },
    },
    select: { startAt: true, createdAt: true },
  });

  const eventDates = events.map((event) => event.startAt ?? event.createdAt);
  const weeklyStreak = getWeeklyEventCounts(
    eventDates,
    params.referenceDate,
    params.weekCount,
  );

  return { intention, weeklyStreak };
}
