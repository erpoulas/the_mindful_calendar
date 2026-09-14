"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { UpdateTimezoneSchema } from "@/lib/user-settings-schemas";
import { setUserTimezone } from "@/lib/user-settings";
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
