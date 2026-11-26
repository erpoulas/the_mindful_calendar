import { createCalendarEvent, removeCalendarEventRow } from "./calendar-events";
import { removeJournalSchedule } from "./journal-schedules";
import type { DbClient } from "./db";
import { getOrCreateJournalIntention } from "./intentions";
import { getUserTimezoneWithFallback } from "./user-settings";
import { toWallClockDate } from "./wall-clock";

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
      schedule: true,
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

  // Its journal time is named after it, so mark the schedule changed: the
  // next sync renames the repeating event in Google.
  await client.journalSchedule.updateMany({
    where: { journalId: journal.id },
    data: { updatedAt: new Date() },
  });
  return client.journal.update({ where: { id: journal.id }, data: { name: params.name } });
}

/**
 * Deletes a journal with its pages and prompts. Its future journal events
 * go with it: its repeating journal time (in Google too) and any entry
 * event set after `now`. Its past entries' events stay on the calendar as
 * plain events, unless `deletePastEvents` is set. `now` is wall-clock and
 * defaults to now in the user's time zone.
 */
export async function deleteJournal(
  client: DbClient,
  params: { userId: string; journalId: string; deletePastEvents?: boolean; now?: Date },
) {
  const journal = await client.journal.findFirst({
    where: { id: params.journalId, userId: params.userId },
  });
  if (!journal) return null;

  // Its schedule goes with it; this also deletes the repeating event in Google.
  await removeJournalSchedule(client, { userId: params.userId, journalId: journal.id });

  const now =
    params.now ?? toWallClockDate(new Date(), await getUserTimezoneWithFallback(client, params.userId));
  const events = await client.calendarEvent.findMany({
    where: {
      journalEntry: { journalId: journal.id },
      ...(params.deletePastEvents ? {} : { startAt: { gt: now } }),
    },
  });
  // Through removeCalendarEventRow, so the next sync deletes them in Google too.
  for (const event of events) await removeCalendarEventRow(client, event);

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

  // Events are stored as wall-clock times, so "now" must be converted to the
  // user's time zone first -- otherwise an 8pm entry in New York lands at 1am.
  const startAt =
    params.startAt ??
    toWallClockDate(new Date(), await getUserTimezoneWithFallback(client, params.userId));

  const event = await createCalendarEvent(client, {
    userId: params.userId,
    title: params.promptText ?? journal.name,
    startAt,
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
  // Left out, a field stays as it is; a null promptText removes the prompt.
  params: {
    userId: string;
    entryId: string;
    content?: string;
    promptText?: string | null;
    mediaUrls?: string[];
  },
) {
  const entry = await client.journalEntry.findFirst({
    where: { id: params.entryId, userId: params.userId },
  });
  if (!entry) return null;

  // The entry's calendar event is titled after its prompt (or the journal's
  // name without one, as createJournalEntry does), so it follows a new prompt.
  // A normal update, so the Google sync sees the change.
  if (params.promptText !== undefined) {
    const journal = await client.journal.findUniqueOrThrow({ where: { id: entry.journalId } });
    await client.calendarEvent.update({
      where: { id: entry.calendarEventId },
      data: { title: params.promptText ?? journal.name },
    });
  }

  return client.journalEntry.update({
    where: { id: entry.id },
    data: { content: params.content, promptText: params.promptText, mediaUrls: params.mediaUrls },
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

  const event = await client.calendarEvent.findUniqueOrThrow({
    where: { id: entry.calendarEventId },
  });
  await removeCalendarEventRow(client, event);
  return entry;
}
