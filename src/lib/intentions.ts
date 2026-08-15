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
