import type { DbClient } from "./db";

export async function createSeason(
  client: DbClient,
  data: {
    userId: string;
    name: string;
    startDate?: Date;
    endDate?: Date;
    note?: string;
  },
) {
  return client.season.create({ data });
}

export async function listSeasons(client: DbClient, userId: string) {
  return client.season.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getSeasonDetail(
  client: DbClient,
  params: { userId: string; seasonId: string },
) {
  const season = await client.season.findFirst({
    where: { id: params.seasonId, userId: params.userId },
  });
  if (!season) return null;

  const intentions = await client.intention.findMany({
    where: { userId: params.userId },
    orderBy: { createdAt: "asc" },
  });

  const dateFilter =
    season.startDate && season.endDate
      ? { startAt: { gte: season.startDate, lt: season.endDate } }
      : {};

  const intentionBreakdown = await Promise.all(
    intentions.map(async (intention) => {
      const count = await client.calendarEvent.count({
        where: {
          userId: params.userId,
          intentions: { some: { intentionId: intention.id } },
          ...dateFilter,
        },
      });
      return { intentionId: intention.id, name: intention.name, count };
    }),
  );

  return { season, intentionBreakdown };
}

export async function updateSeason(
  client: DbClient,
  params: {
    userId: string;
    seasonId: string;
    name: string;
    startDate?: Date;
    endDate?: Date;
    note?: string;
  },
) {
  const season = await client.season.findFirst({
    where: { id: params.seasonId, userId: params.userId },
  });
  if (!season) return null;

  return client.season.update({
    where: { id: season.id },
    data: {
      name: params.name,
      startDate: params.startDate,
      endDate: params.endDate,
      note: params.note,
    },
  });
}

export async function reflectOnSeason(
  client: DbClient,
  params: { userId: string; seasonId: string; reflectionText: string },
) {
  const season = await client.season.findFirst({
    where: { id: params.seasonId, userId: params.userId },
  });
  if (!season) return null;

  return client.season.update({
    where: { id: season.id },
    data: { reflectionText: params.reflectionText, reflectedAt: new Date() },
  });
}

export async function deleteSeason(
  client: DbClient,
  params: { userId: string; seasonId: string },
) {
  const season = await client.season.findFirst({
    where: { id: params.seasonId, userId: params.userId },
  });
  if (!season) return null;

  await client.season.delete({ where: { id: season.id } });
  return season;
}
