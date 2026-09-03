import type { DbClient } from "./db";

export async function createQuickList(
  client: DbClient,
  data: { userId: string; name: string },
) {
  return client.quickList.create({ data });
}

export async function listQuickLists(client: DbClient, userId: string) {
  return client.quickList.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getQuickListDetail(
  client: DbClient,
  params: { userId: string; quickListId: string },
) {
  return client.quickList.findFirst({
    where: { id: params.quickListId, userId: params.userId },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });
}

export async function updateQuickList(
  client: DbClient,
  params: { userId: string; quickListId: string; name: string },
) {
  const list = await client.quickList.findFirst({
    where: { id: params.quickListId, userId: params.userId },
  });
  if (!list) return null;

  return client.quickList.update({
    where: { id: list.id },
    data: { name: params.name },
  });
}

export async function deleteQuickList(
  client: DbClient,
  params: { userId: string; quickListId: string },
) {
  const list = await client.quickList.findFirst({
    where: { id: params.quickListId, userId: params.userId },
  });
  if (!list) return null;

  await client.quickList.delete({ where: { id: list.id } });
  return list;
}

export async function addQuickListItem(
  client: DbClient,
  params: { userId: string; quickListId: string; text: string },
) {
  const list = await client.quickList.findFirst({
    where: { id: params.quickListId, userId: params.userId },
  });
  if (!list) return null;

  return client.quickListItem.create({
    data: { quickListId: params.quickListId, text: params.text },
  });
}

export async function toggleQuickListItem(
  client: DbClient,
  params: { userId: string; itemId: string },
) {
  const item = await client.quickListItem.findFirst({
    where: { id: params.itemId, quickList: { userId: params.userId } },
  });
  if (!item) return null;

  return client.quickListItem.update({
    where: { id: item.id },
    data: { done: !item.done },
  });
}
