"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CreateCalendarEventSchema, QuickAddEventSchema } from "@/lib/calendar-event-schemas";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from "@/lib/calendar-events";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";

export type CalendarEventFormState =
  | {
      errors?: {
        title?: string[];
        startAt?: string[];
        endAt?: string[];
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
  });
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
    startAt: validated.data.startAt ? new Date(validated.data.startAt) : undefined,
    endAt: validated.data.endAt ? new Date(validated.data.endAt) : undefined,
    isAllDay: validated.data.isAllDay,
    location: validated.data.location,
    notes: validated.data.notes,
    projectId: validated.data.projectId,
    intentionIds: validated.data.intentionIds,
  });

  revalidatePath("/calendar");
  redirect("/calendar");
}

export async function quickAddEventAction(formData: FormData) {
  const validated = QuickAddEventSchema.safeParse({ title: formData.get("title") });
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  await createCalendarEvent(db, { userId, title: validated.data.title });

  revalidatePath("/calendar");
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
    startAt: validated.data.startAt ? new Date(validated.data.startAt) : undefined,
    endAt: validated.data.endAt ? new Date(validated.data.endAt) : undefined,
    isAllDay: validated.data.isAllDay,
    location: validated.data.location,
    notes: validated.data.notes,
    projectId: validated.data.projectId,
    intentionIds: validated.data.intentionIds,
  });

  revalidatePath("/calendar");
  redirect("/calendar");
}

export async function deleteCalendarEventAction(eventId: string) {
  const userId = await getCurrentUserId();
  await deleteCalendarEvent(db, { userId, eventId });

  revalidatePath("/calendar");
  redirect("/calendar");
}
