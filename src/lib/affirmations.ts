import type { DbClient } from "./db";

export async function addAffirmation(
  client: DbClient,
  data: { userId: string; text: string },
) {
  return client.affirmation.create({ data });
}

export async function listAffirmations(client: DbClient, userId: string) {
  return client.affirmation.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getRandomAffirmation(client: DbClient, userId: string) {
  const affirmations = await client.affirmation.findMany({ where: { userId } });
  if (affirmations.length === 0) return null;

  return affirmations[Math.floor(Math.random() * affirmations.length)];
}

export async function deleteAffirmation(
  client: DbClient,
  params: { userId: string; affirmationId: string },
) {
  const affirmation = await client.affirmation.findFirst({
    where: { id: params.affirmationId, userId: params.userId },
  });
  if (!affirmation) return null;

  await client.affirmation.delete({ where: { id: affirmation.id } });
  return affirmation;
}

export async function setTodayAffirmation(
  client: DbClient,
  params: { userId: string; text: string },
) {
  return client.todayAffirmation.upsert({
    where: { userId: params.userId },
    create: { userId: params.userId, text: params.text },
    update: { text: params.text, setAt: new Date() },
  });
}

function isToday(date: Date) {
  const now = new Date();
  return (
    date.getUTCFullYear() === now.getUTCFullYear() &&
    date.getUTCMonth() === now.getUTCMonth() &&
    date.getUTCDate() === now.getUTCDate()
  );
}

export async function getTodayAffirmation(
  client: DbClient,
  userId: string,
): Promise<{ text: string; isOverride: boolean } | null> {
  const override = await client.todayAffirmation.findUnique({ where: { userId } });
  if (override && isToday(override.setAt)) {
    return { text: override.text, isOverride: true };
  }

  const picked = await getRandomAffirmation(client, userId);
  return picked ? { text: picked.text, isOverride: false } : null;
}
