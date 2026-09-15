import type { DbClient } from "./db";

export async function createPostIt(client: DbClient, data: { userId: string; text: string }) {
  const last = await client.postIt.findFirst({
    where: { userId: data.userId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const order = last ? last.order + 1 : 0;

  return client.postIt.create({ data: { ...data, order } });
}

export async function listPostIts(client: DbClient, userId: string) {
  return client.postIt.findMany({
    where: { userId },
    orderBy: { order: "asc" },
  });
}

export async function reorderPostIts(
  client: DbClient,
  params: { userId: string; orderedIds: string[] },
) {
  const owned = await client.postIt.findMany({
    where: { userId: params.userId, id: { in: params.orderedIds } },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((postIt) => postIt.id));
  const ordered = params.orderedIds.filter((id) => ownedIds.has(id));

  await Promise.all(
    ordered.map((id, index) => client.postIt.update({ where: { id }, data: { order: index } })),
  );
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
