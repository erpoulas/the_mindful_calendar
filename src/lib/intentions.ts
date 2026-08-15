import type { DbClient } from "./db";

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
