import type { DbClient } from "./db";
import type { DopamineCourse } from "./dopamine-courses";

export async function addDopamineMenuItem(
  client: DbClient,
  data: { userId: string; text: string; course?: DopamineCourse | null },
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

/**
 * Tags an item with an intention (null clears it), so events made from it
 * count toward that intention. Returns null, changing nothing, unless both
 * the item and the intention are this user's.
 */
export async function setDopamineMenuItemIntention(
  client: DbClient,
  params: { userId: string; itemId: string; intentionId: string | null },
) {
  const item = await client.dopamineMenuItem.findFirst({
    where: { id: params.itemId, userId: params.userId },
  });
  if (!item) return null;

  if (params.intentionId) {
    const intention = await client.intention.findFirst({
      where: { id: params.intentionId, userId: params.userId },
    });
    if (!intention) return null;
  }

  return client.dopamineMenuItem.update({
    where: { id: item.id },
    data: { intentionId: params.intentionId },
  });
}

/** Changes an item's text. Returns null, changing nothing, unless it's this user's. */
export async function updateDopamineMenuItemText(
  client: DbClient,
  params: { userId: string; itemId: string; text: string },
) {
  const item = await client.dopamineMenuItem.findFirst({
    where: { id: params.itemId, userId: params.userId },
  });
  if (!item) return null;

  return client.dopamineMenuItem.update({
    where: { id: item.id },
    data: { text: params.text },
  });
}

/**
 * Puts an item under a course on the menu (null takes it off, to "Anytime").
 * Returns null, changing nothing, unless it's this user's.
 */
export async function setDopamineMenuItemCourse(
  client: DbClient,
  params: { userId: string; itemId: string; course: DopamineCourse | null },
) {
  const item = await client.dopamineMenuItem.findFirst({
    where: { id: params.itemId, userId: params.userId },
  });
  if (!item) return null;

  return client.dopamineMenuItem.update({
    where: { id: item.id },
    data: { course: params.course },
  });
}
