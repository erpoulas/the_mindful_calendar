import type { DbClient } from "./db";

export async function createCalendarEvent(
  client: DbClient,
  data: {
    userId: string;
    title: string;
    startAt?: Date;
    endAt?: Date;
    isAllDay?: boolean;
    location?: string;
    notes?: string;
    projectId?: string;
    intentionIds?: string[];
  },
) {
  return client.calendarEvent.create({
    data: {
      userId: data.userId,
      title: data.title,
      startAt: data.startAt,
      endAt: data.endAt,
      isAllDay: data.isAllDay ?? false,
      location: data.location,
      notes: data.notes,
      projectId: data.projectId,
      intentions: data.intentionIds
        ? { create: data.intentionIds.map((intentionId) => ({ intentionId })) }
        : undefined,
    },
    include: { intentions: true },
  });
}

export async function listCalendarEvents(
  client: DbClient,
  params: { userId: string; start: Date; end: Date },
) {
  return client.calendarEvent.findMany({
    where: {
      userId: params.userId,
      startAt: { gte: params.start, lt: params.end },
    },
    orderBy: { startAt: "asc" },
  });
}

export async function getCalendarEvent(
  client: DbClient,
  params: { userId: string; eventId: string },
) {
  return client.calendarEvent.findFirst({
    where: { id: params.eventId, userId: params.userId },
    include: { intentions: true },
  });
}

export async function updateCalendarEvent(
  client: DbClient,
  params: {
    userId: string;
    eventId: string;
    title: string;
    startAt?: Date;
    endAt?: Date;
    isAllDay?: boolean;
    location?: string;
    notes?: string;
    projectId?: string;
    intentionIds?: string[];
  },
) {
  const event = await client.calendarEvent.findFirst({
    where: { id: params.eventId, userId: params.userId },
  });
  if (!event) return null;

  return client.calendarEvent.update({
    where: { id: event.id },
    data: {
      title: params.title,
      startAt: params.startAt ?? null,
      endAt: params.endAt ?? null,
      isAllDay: params.isAllDay ?? false,
      location: params.location ?? null,
      notes: params.notes ?? null,
      projectId: params.projectId ?? null,
      intentions: {
        deleteMany: {},
        create: (params.intentionIds ?? []).map((intentionId) => ({ intentionId })),
      },
    },
    include: { intentions: true },
  });
}

export async function deleteCalendarEvent(
  client: DbClient,
  params: { userId: string; eventId: string },
) {
  const event = await client.calendarEvent.findFirst({
    where: { id: params.eventId, userId: params.userId },
  });
  if (!event) return null;

  await removeCalendarEventRow(client, event);
  return event;
}

/**
 * Deletes an event row. If it is synced with Google Calendar, it also leaves
 * a note for the next sync to delete it there, since afterwards the row
 * (and with it the Google id) is gone. Every app-side delete goes through here.
 */
export async function removeCalendarEventRow(
  client: DbClient,
  event: { id: string; userId: string; googleEventId: string | null },
) {
  if (event.googleEventId) {
    await client.googleEventDeletion.upsert({
      where: { googleEventId: event.googleEventId },
      create: { googleEventId: event.googleEventId, userId: event.userId },
      update: {},
    });
  }
  await client.calendarEvent.delete({ where: { id: event.id } });
}

// A focused partial update for drag-and-drop on the time-grid -- only
// touches startAt/endAt (endAt explicitly nullable, unlike
// updateCalendarEvent's full-replace shape) so a drag never disturbs the
// event's other fields.
export async function moveCalendarEvent(
  client: DbClient,
  params: { userId: string; eventId: string; startAt: Date; endAt: Date | null },
) {
  const event = await client.calendarEvent.findFirst({
    where: { id: params.eventId, userId: params.userId },
  });
  if (!event) return null;

  return client.calendarEvent.update({
    where: { id: event.id },
    data: { startAt: params.startAt, endAt: params.endAt },
  });
}
