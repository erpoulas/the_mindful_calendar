"use server";

import { z } from "zod";
import { UpdateCalendarDisplaySchema, UpdateTimezoneSchema } from "@/lib/user-settings-schemas";
import { getUserTimezone, setCalendarDisplaySettings, setUserTimezone } from "@/lib/user-settings";
import { searchTimezones, type TimezoneMatch } from "@/lib/timezone-search";
import { getCurrentUserId } from "@/lib/auth";
import { forgetStoredAfterSave } from "@/lib/stored-results";
import { db } from "@/lib/db";

export type TimezoneFormState = { errors?: { timezone?: string[] }; saved?: boolean } | undefined;

export async function updateTimezoneAction(
  _state: TimezoneFormState,
  formData: FormData,
): Promise<TimezoneFormState> {
  const validated = UpdateTimezoneSchema.safeParse({ timezone: formData.get("timezone") });
  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const userId = await getCurrentUserId();
  await setUserTimezone(db, { userId, timezone: validated.data.timezone });

  forgetStoredAfterSave(userId, ["settings","events"]);
  return { saved: true };
}

/** Time zone search for the pickers in Account settings ("Boulder" → America/Denver). */
export async function searchTimezonesAction(query: string): Promise<TimezoneMatch[]> {
  await getCurrentUserId(); // signed-in users only
  return searchTimezones(String(query).slice(0, 100));
}

/** Saves the browser's time zone for a user who never picked one, so times don't fall back to UTC. */
export async function saveBrowserTimezoneAction(timezone: string) {
  const validated = UpdateTimezoneSchema.safeParse({ timezone });
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  if (await getUserTimezone(db, userId)) return; // never overwrite a choice

  await setUserTimezone(db, { userId, timezone: validated.data.timezone });
  forgetStoredAfterSave(userId, ["settings","events"]);
}

export type CalendarDisplayFormState =
  | { errors?: { extraTimezones?: string[]; clockFormat?: string[] }; saved?: boolean }
  | undefined;

export async function updateCalendarDisplayAction(
  _state: CalendarDisplayFormState,
  formData: FormData,
): Promise<CalendarDisplayFormState> {
  const validated = UpdateCalendarDisplaySchema.safeParse({
    extraTimezones: formData.getAll("extraTimezones"),
    clockFormat: formData.get("clockFormat"),
  });
  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const userId = await getCurrentUserId();
  await setCalendarDisplaySettings(db, { userId, ...validated.data });

  forgetStoredAfterSave(userId, ["settings"]);
  return { saved: true };
}
