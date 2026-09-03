import { createCalendarEvent } from "./calendar-events";
import type { DbClient } from "./db";
import { getOrCreateJournalIntention } from "./intentions";

export async function createJournal(client: DbClient, data: { userId: string; name: string }) {
  return client.journal.create({ data });
}

export async function listJournals(client: DbClient, userId: string) {
  return client.journal.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getJournalDetail(
  client: DbClient,
  params: { userId: string; journalId: string },
) {
  return client.journal.findFirst({
    where: { id: params.journalId, userId: params.userId },
    include: {
      prompts: { orderBy: { createdAt: "asc" } },
      entries: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function updateJournal(
  client: DbClient,
  params: { userId: string; journalId: string; name: string },
) {
  const journal = await client.journal.findFirst({
    where: { id: params.journalId, userId: params.userId },
  });
  if (!journal) return null;

  return client.journal.update({ where: { id: journal.id }, data: { name: params.name } });
}

export async function deleteJournal(
  client: DbClient,
  params: { userId: string; journalId: string },
) {
  const journal = await client.journal.findFirst({
    where: { id: params.journalId, userId: params.userId },
  });
  if (!journal) return null;

  await client.journal.delete({ where: { id: journal.id } });
  return journal;
}

export async function addJournalPrompt(
  client: DbClient,
  params: { userId: string; journalId: string; text: string },
) {
  const journal = await client.journal.findFirst({
    where: { id: params.journalId, userId: params.userId },
  });
  if (!journal) return null;

  return client.journalPrompt.create({
    data: { journalId: params.journalId, text: params.text },
  });
}

export async function deleteJournalPrompt(
  client: DbClient,
  params: { userId: string; promptId: string },
) {
  const prompt = await client.journalPrompt.findFirst({
    where: { id: params.promptId, journal: { userId: params.userId } },
  });
  if (!prompt) return null;

  await client.journalPrompt.delete({ where: { id: prompt.id } });
  return prompt;
}

export async function getRandomJournalPrompt(
  client: DbClient,
  params: { userId: string; journalId: string },
) {
  const journal = await client.journal.findFirst({
    where: { id: params.journalId, userId: params.userId },
  });
  if (!journal) return null;

  const prompts = await client.journalPrompt.findMany({
    where: { journalId: params.journalId },
  });
  if (prompts.length === 0) return null;

  return prompts[Math.floor(Math.random() * prompts.length)];
}

// Creating an entry also creates its linked calendar event -- spontaneous
// writing creates the event "now", or a future startAt pre-schedules it.
// The event is tagged to the automatic Journal intention with no setup,
// plus any additional intentions given. Entry content never touches the
// event -- only the title (== the prompt, if any) is meant to sync anywhere.
export async function createJournalEntry(
  client: DbClient,
  params: {
    userId: string;
    journalId: string;
    promptText?: string;
    content?: string;
    mediaUrls?: string[];
    startAt?: Date;
    intentionIds?: string[];
  },
) {
  const journal = await client.journal.findFirst({
    where: { id: params.journalId, userId: params.userId },
  });
  if (!journal) return null;

  const journalIntention = await getOrCreateJournalIntention(client, params.userId);

  const event = await createCalendarEvent(client, {
    userId: params.userId,
    title: params.promptText ?? journal.name,
    startAt: params.startAt ?? new Date(),
    intentionIds: [journalIntention.id, ...(params.intentionIds ?? [])],
  });

  return client.journalEntry.create({
    data: {
      userId: params.userId,
      journalId: params.journalId,
      calendarEventId: event.id,
      promptText: params.promptText,
      content: params.content,
      mediaUrls: params.mediaUrls ?? [],
    },
  });
}

export async function updateJournalEntry(
  client: DbClient,
  params: { userId: string; entryId: string; content?: string; mediaUrls?: string[] },
) {
  const entry = await client.journalEntry.findFirst({
    where: { id: params.entryId, userId: params.userId },
  });
  if (!entry) return null;

  return client.journalEntry.update({
    where: { id: entry.id },
    data: { content: params.content, mediaUrls: params.mediaUrls },
  });
}

// Deleting the linked calendar event cascades to delete the entry itself
// (see JournalEntry.event in the schema), so that's the only delete needed.
export async function deleteJournalEntry(
  client: DbClient,
  params: { userId: string; entryId: string },
) {
  const entry = await client.journalEntry.findFirst({
    where: { id: params.entryId, userId: params.userId },
  });
  if (!entry) return null;

  await client.calendarEvent.delete({ where: { id: entry.calendarEventId } });
  return entry;
}
