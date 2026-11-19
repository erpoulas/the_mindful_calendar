import type { DbClient } from "./db";
import { getWeekRange } from "./calendar-week";

export async function getWeeklyIntentionBreakdown(
  client: DbClient,
  params: { userId: string; referenceDate: Date },
) {
  const { start, end } = getWeekRange(params.referenceDate);

  // Four queries side by side, however many intentions there are: one
  // grouped count gives every intention's number at once, instead of one
  // count query per intention.
  const [intentions, countsByIntention, totalCount, untaggedCount] = await Promise.all([
    client.intention.findMany({
      where: { userId: params.userId },
      orderBy: { createdAt: "asc" },
    }),
    client.eventIntention.groupBy({
      by: ["intentionId"],
      where: { event: { userId: params.userId, startAt: { gte: start, lt: end } } },
      _count: { _all: true },
    }),
    client.calendarEvent.count({
      where: { userId: params.userId, startAt: { gte: start, lt: end } },
    }),
    client.calendarEvent.count({
      where: {
        userId: params.userId,
        startAt: { gte: start, lt: end },
        intentions: { none: {} },
      },
    }),
  ]);

  const countByIntentionId = new Map(
    countsByIntention.map((row) => [row.intentionId, row._count._all]),
  );
  const breakdownCounts = intentions.map((intention) => ({
    intentionId: intention.id,
    name: intention.name,
    color: intention.color,
    count: countByIntentionId.get(intention.id) ?? 0,
  }));

  const toPercent = (count: number) =>
    totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

  return {
    weekStart: start,
    weekEnd: end,
    totalCount,
    breakdown: breakdownCounts.map((b) => ({ ...b, percent: toPercent(b.count) })),
    untagged: { count: untaggedCount, percent: toPercent(untaggedCount) },
  };
}

export async function getWeeklyReviewStats(
  client: DbClient,
  params: { userId: string; referenceDate: Date },
) {
  const { start, end } = getWeekRange(params.referenceDate);

  const [intentionBreakdown, tasksCompleted, quickListItemsCompleted, projectsCompleted] =
    await Promise.all([
      getWeeklyIntentionBreakdown(client, params),
      client.projectTask.count({
        where: { completedAt: { gte: start, lt: end }, project: { userId: params.userId } },
      }),
      client.quickListItem.count({
        where: { doneAt: { gte: start, lt: end }, quickList: { userId: params.userId } },
      }),
      client.project.count({
        where: { completedAt: { gte: start, lt: end }, userId: params.userId },
      }),
    ]);

  return {
    weekStart: start,
    weekEnd: end,
    intentionBreakdown,
    tasksCompleted,
    quickListItemsCompleted,
    projectsCompleted,
  };
}
