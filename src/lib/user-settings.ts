import type { DbClient } from "./db";

export async function getUserTimezone(client: DbClient, userId: string): Promise<string | null> {
  const settings = await client.userSettings.findUnique({ where: { userId } });
  return settings?.timezone ?? null;
}

/** The saved timezone, or UTC for users who haven't picked one yet. */
export async function getUserTimezoneWithFallback(
  client: DbClient,
  userId: string,
): Promise<string> {
  return (await getUserTimezone(client, userId)) ?? "UTC";
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
