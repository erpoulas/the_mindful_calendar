"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { CreateIntentionSchema } from "@/lib/intention-schemas";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import {
  createIntention,
  deleteIntention,
  setIntentionColor,
  updateIntention,
} from "@/lib/intentions";
import { getCurrentUserId } from "@/lib/auth";
import { forgetStoredAfterSave } from "@/lib/stored-results";
import { db } from "@/lib/db";

export type IntentionFormState =
  | {
      errors?: {
        name?: string[];
        color?: string[];
      };
    }
  | undefined;

function parseIntentionFormData(formData: FormData) {
  const rawColor = formData.get("color");

  return CreateIntentionSchema.safeParse({
    name: formData.get("name"),
    color: rawColor && String(rawColor).trim() !== "" ? rawColor : undefined,
  });
}

export async function createIntentionAction(
  _state: IntentionFormState,
  formData: FormData,
): Promise<IntentionFormState> {
  const validated = parseIntentionFormData(formData);

  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const userId = await getCurrentUserId();
  await createIntention(db, { userId, ...validated.data });

  forgetStoredAfterSave(userId, ["intentions"]);
}

export async function updateIntentionAction(
  intentionId: string,
  _state: IntentionFormState,
  formData: FormData,
): Promise<IntentionFormState> {
  const validated = parseIntentionFormData(formData);

  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const userId = await getCurrentUserId();
  await updateIntention(db, { userId, intentionId, ...validated.data });

  forgetStoredAfterSave(userId, ["intentions","events"]);
  redirect("/dashboard");
}

export async function deleteIntentionAction(intentionId: string) {
  const userId = await getCurrentUserId();
  await deleteIntention(db, { userId, intentionId });

  // Dopamine-menu items tagged with it lose their tag.
  forgetStoredAfterSave(userId, ["intentions","events","projects","dopamineMenu"]);
  // Back to the intentions list: deleting from the list keeps you there, and
  // deleting from an intention's own screen returns to the list.
  redirect(dashboardRoutes.intentions());
}

/**
 * Recolors an intention from the color dot on the intentions list ("" for
 * no color). Also allowed for the built-in Journal intention. Its events
 * are drawn in the new color, so the stored events are forgotten too.
 */
export async function updateIntentionColorAction(intentionId: string, colorKey: string) {
  const validated = CreateIntentionSchema.shape.color.safeParse(colorKey || undefined);
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  await setIntentionColor(db, { userId, intentionId, color: validated.data ?? null });

  forgetStoredAfterSave(userId, ["intentions", "events"]);
}
