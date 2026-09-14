import type { DbClient } from "./db";

export async function createPostIt(client: DbClient, data: { userId: string; text: string }) {
  return client.postIt.create({ data });
}

export async function listPostIts(client: DbClient, userId: string) {
  return client.postIt.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function deletePostIt(
  client: DbClient,
  params: { userId: string; postItId: string },
) {
  const postIt = await client.postIt.findFirst({
    where: { id: params.postItId, userId: params.userId },
  });
  if (!postIt) return null;

  await client.postIt.delete({ where: { id: postIt.id } });
  return postIt;
}

export async function promoteQuickListItemToPostIt(
  client: DbClient,
  params: { userId: string; itemId: string },
) {
  const item = await client.quickListItem.findFirst({
    where: { id: params.itemId, quickList: { userId: params.userId } },
  });
  if (!item) return null;

  const postIt = await client.postIt.create({
    data: { userId: params.userId, text: item.text },
  });
  await client.quickListItem.delete({ where: { id: item.id } });

  return postIt;
}
