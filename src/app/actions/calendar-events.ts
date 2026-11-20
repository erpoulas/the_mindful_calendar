"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { CreateCalendarEventSchema } from "@/lib/calendar-event-schemas";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  moveCalendarEvent,
  updateCalendarEvent,
} from "@/lib/calendar-events";
import { getCurrentUserId } from "@/lib/auth";
import { forgetStoredAfterSave } from "@/lib/stored-results";
import { db } from "@/lib/db";
import { deletePostIt } from "@/lib/post-its";
import { getUserTimezoneWithFallback } from "@/lib/user-settings";
import { convertWallClock } from "@/lib/wall-clock";

export type CalendarEventFormState =
  | {
      errors?: {
        title?: string[];
        startAt?: string[];
        endAt?: string[];
        timeZone?: string[];
      };
    }
  | undefined;

function parseCalendarEventFormData(formData: FormData) {
  const rawStartAt = formData.get("startAt");
  const rawEndAt = formData.get("endAt");
  const rawProjectId = formData.get("projectId");

  return CreateCalendarEventSchema.safeParse({
    title: formData.get("title"),
    startAt: rawStartAt && String(rawStartAt).trim() !== "" ? `${rawStartAt}:00Z` : undefined,
    endAt: rawEndAt && String(rawEndAt).trim() !== "" ? `${rawEndAt}:00Z` : undefined,
    isAllDay: formData.get("isAllDay") === "on",
    location: formData.get("location") || undefined,
    notes: formData.get("notes") || undefined,
    projectId: rawProjectId && String(rawProjectId).trim() !== "" ? rawProjectId : undefined,
    intentionIds: formData.getAll("intentionIds"),
    timeZone: formData.get("timeZone") || undefined,
  });
}

type ParsedEventTimes = { startAt?: string; endAt?: string; isAllDay?: boolean; timeZone?: string };

/**
 * The form's times are read on the clock of the zone picked in the form;
 * the calendar stores them on the user's main zone's clock. So 9:00am
 * entered as Chicago time is saved as 8:00am for a Denver user. The picked
 * zone is remembered only when it differs from the main one. All-day
 * events are just dates, so they're never shifted.
 */
async function toStoredEventTimes(userId: string, data: ParsedEventTimes) {
  const mainTimeZone = await getUserTimezoneWithFallback(db, userId);
  const eventTimeZone = data.isAllDay ? mainTimeZone : (data.timeZone ?? mainTimeZone);
  const toMainZone = (value?: string) =>
    value ? convertWallClock(new Date(value), eventTimeZone, mainTimeZone) : undefined;

  return {
    startAt: toMainZone(data.startAt),
    endAt: toMainZone(data.endAt),
    timeZone: eventTimeZone === mainTimeZone ? undefined : eventTimeZone,
  };
}

export async function createCalendarEventAction(
  _state: CalendarEventFormState,
  formData: FormData,
): Promise<CalendarEventFormState> {
  const validated = parseCalendarEventFormData(formData);
  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const userId = await getCurrentUserId();
  await createCalendarEvent(db, {
    userId,
    title: validated.data.title,
    ...(await toStoredEventTimes(userId, validated.data)),
    isAllDay: validated.data.isAllDay,
    location: validated.data.location,
    notes: validated.data.notes,
    projectId: validated.data.projectId,
    intentionIds: validated.data.intentionIds,
  });

  const postItId = formData.get("postItId");
  if (typeof postItId === "string" && postItId !== "") {
    await deletePostIt(db, { userId, postItId });
  }

  forgetStoredAfterSave(userId, ["events","postIts"]);
  redirect("/dashboard");
}

export async function updateCalendarEventAction(
  eventId: string,
  _state: CalendarEventFormState,
  formData: FormData,
): Promise<CalendarEventFormState> {
  const validated = parseCalendarEventFormData(formData);
  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const userId = await getCurrentUserId();
  await updateCalendarEvent(db, {
    userId,
    eventId,
    title: validated.data.title,
    ...(await toStoredEventTimes(userId, validated.data)),
    isAllDay: validated.data.isAllDay,
    location: validated.data.location,
    notes: validated.data.notes,
    projectId: validated.data.projectId,
    intentionIds: validated.data.intentionIds,
  });

  forgetStoredAfterSave(userId, ["events"]);
  redirect("/dashboard");
}

export async function deleteCalendarEventAction(eventId: string) {
  const userId = await getCurrentUserId();
  await deleteCalendarEvent(db, { userId, eventId });

  forgetStoredAfterSave(userId, ["events","journals"]);
  redirect("/dashboard");
}

// Called directly from the time-grid's drag handler (not a <form>), so it
// must not redirect -- the grid stays mounted and refreshes itself.
export async function moveCalendarEventAction(
  eventId: string,
  startAt: Date,
  endAt: Date | null,
) {
  const userId = await getCurrentUserId();
  await moveCalendarEvent(db, { userId, eventId, startAt, endAt });

  forgetStoredAfterSave(userId, ["events"]);
}
