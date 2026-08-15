import type { DbClient } from "./db";

export async function createIntention(
  client: DbClient,
  data: { userId: string; name: string; color?: string },
) {
  return client.intention.create({ data });
}
