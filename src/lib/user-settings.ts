import type { DbClient } from "./db";

export async function getUserTimezone(client: DbClient, userId: string): Promise<string | null> {
  const settings = await client.userSettings.findUnique({ where: { userId } });
  return settings?.timezone ?? null;
}

export async function setUserTimezone(
  client: DbClient,
  params: { userId: string; timezone: string },
) {
  return client.userSettings.upsert({
    where: { userId: params.userId },
    create: { userId: params.userId, timezone: params.timezone },
    update: { timezone: params.timezone },
  });
}
