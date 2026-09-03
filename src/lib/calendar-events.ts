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
