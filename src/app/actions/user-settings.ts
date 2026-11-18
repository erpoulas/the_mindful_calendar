"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { UpdateCalendarDisplaySchema, UpdateTimezoneSchema } from "@/lib/user-settings-schemas";
import { setCalendarDisplaySettings, setUserTimezone } from "@/lib/user-settings";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";

export type TimezoneFormState = { errors?: { timezone?: string[] } } | undefined;

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

  revalidatePath("/dashboard");
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

  revalidatePath("/dashboard");
  return { saved: true };
}
