import { createCalendarEvent } from "./calendar-events";
import type { DbClient } from "./db";

// "Start now": turns a quick-list item, project task or dopamine-menu item
// into a 1-hour calendar event that starts the moment it's clicked. The
// event's notes say where it came from, since the item itself has no
// description. Every function returns null if the item isn't this user's.
//
// `now` must already be on the user's wall clock (toWallClockDate), like
// every stored event time; see "Times and time zones" in AGENTS.md.

const MS_PER_MINUTE = 60 * 1000;
const EVENT_LENGTH_MINUTES = 60;

/** From the start of the clicked minute, for one hour. */
export function oneHourStartingAt(now: Date) {
  const startAt = new Date(Math.floor(now.getTime() / MS_PER_MINUTE) * MS_PER_MINUTE);
  const endAt = new Date(startAt.getTime() + EVENT_LENGTH_MINUTES * MS_PER_MINUTE);
  return { startAt, endAt };
}

type ScheduleNowParams = { userId: string; now: Date };

export async function scheduleQuickListItemNow(
  client: DbClient,
  params: ScheduleNowParams & { itemId: string },
) {
  const item = await client.quickListItem.findFirst({
    where: { id: params.itemId, quickList: { userId: params.userId } },
    include: { quickList: { select: { name: true } } },
  });
  if (!item) return null;

  return createCalendarEvent(client, {
    userId: params.userId,
    title: item.text,
    notes: `From quick list: ${item.quickList.name}`,
    ...oneHourStartingAt(params.now),
  });
}

/** The event joins the task's project, so it counts toward the project. */
export async function scheduleProjectTaskNow(
  client: DbClient,
  params: ScheduleNowParams & { taskId: string },
) {
  const task = await client.projectTask.findFirst({
    where: { id: params.taskId, project: { userId: params.userId } },
    include: { project: { select: { id: true, title: true } } },
  });
  if (!task) return null;

  return createCalendarEvent(client, {
    userId: params.userId,
    title: task.text,
    notes: `Task in project: ${task.project.title}`,
    projectId: task.project.id,
    ...oneHourStartingAt(params.now),
  });
}

export async function scheduleDopamineItemNow(
  client: DbClient,
  params: ScheduleNowParams & { itemId: string },
) {
  const item = await client.dopamineMenuItem.findFirst({
    where: { id: params.itemId, userId: params.userId },
  });
  if (!item) return null;

  return createCalendarEvent(client, {
    userId: params.userId,
    title: item.text,
    notes: "From your dopamine menu",
    ...oneHourStartingAt(params.now),
  });
}
