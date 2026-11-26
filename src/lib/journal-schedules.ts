import type { DbClient } from "./db";

// A journal's repeating writing time (see JournalSchedule in schema.prisma).

/** Leaves a note so the next sync deletes the schedule's repeating event in Google. */
async function noteGoogleDeletion(
  client: DbClient,
  schedule: { userId: string; googleEventId: string | null },
) {
  if (!schedule.googleEventId) return;
  await client.googleEventDeletion.upsert({
    where: { googleEventId: schedule.googleEventId },
    create: { googleEventId: schedule.googleEventId, userId: schedule.userId },
    update: {},
  });
}

export async function getJournalSchedule(
  client: DbClient,
  params: { userId: string; journalId: string },
) {
  return client.journalSchedule.findFirst({
    where: { journalId: params.journalId, userId: params.userId },
  });
}

/** Every schedule of the user's journals, with the journal's name (for event titles). */
export async function listJournalSchedules(client: DbClient, userId: string) {
  return client.journalSchedule.findMany({
    where: { userId },
    include: { journal: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Sets (or changes) a journal's repeating time. With no days picked it
 * turns the schedule off instead, returning null. Returns null as well when
 * the journal isn't the user's.
 */
export async function setJournalSchedule(
  client: DbClient,
  params: {
    userId: string;
    journalId: string;
    weekdays: number[];
    startMinutes: number;
    durationMinutes: number;
  },
) {
  const journal = await client.journal.findFirst({
    where: { id: params.journalId, userId: params.userId },
  });
  if (!journal) return null;

  const weekdays = [...new Set(params.weekdays)].sort((a, b) => a - b);
  if (weekdays.length === 0) {
    await removeJournalSchedule(client, params);
    return null;
  }

  const fields = { weekdays, startMinutes: params.startMinutes, durationMinutes: params.durationMinutes };
  return client.journalSchedule.upsert({
    where: { journalId: journal.id },
    create: { userId: params.userId, journalId: journal.id, ...fields },
    update: fields,
  });
}

/** Turns a journal's schedule off, deleting its repeating event in Google too. */
export async function removeJournalSchedule(
  client: DbClient,
  params: { userId: string; journalId: string },
) {
  const schedule = await getJournalSchedule(client, params);
  if (!schedule) return null;

  await noteGoogleDeletion(client, schedule);
  await client.journalSchedule.delete({ where: { id: schedule.id } });
  return schedule;
}
