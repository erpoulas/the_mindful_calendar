import type { DbClient } from "./db";
import { getWeeklyEventCounts } from "./streak";

export async function createIntention(
  client: DbClient,
  data: { userId: string; name: string; color?: string },
) {
  return client.intention.create({ data });
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

  return client.intention.update({
    where: { id: intention.id },
    data: { name: params.name, color: params.color },
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
