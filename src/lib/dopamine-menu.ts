import type { DbClient } from "./db";

export async function addDopamineMenuItem(
  client: DbClient,
  data: { userId: string; text: string },
) {
  return client.dopamineMenuItem.create({ data });
}

export async function listDopamineMenuItems(client: DbClient, userId: string) {
  return client.dopamineMenuItem.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getRandomDopamineMenuItem(client: DbClient, userId: string) {
  const items = await client.dopamineMenuItem.findMany({ where: { userId } });
  if (items.length === 0) return null;

  return items[Math.floor(Math.random() * items.length)];
}

export async function deleteDopamineMenuItem(
  client: DbClient,
  params: { userId: string; itemId: string },
) {
  const item = await client.dopamineMenuItem.findFirst({
    where: { id: params.itemId, userId: params.userId },
  });
  if (!item) return null;

  await client.dopamineMenuItem.delete({ where: { id: item.id } });
  return item;
}
