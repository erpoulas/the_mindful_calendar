"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { CreateIntentionSchema } from "@/lib/intention-schemas";
import { createIntention, deleteIntention, updateIntention } from "@/lib/intentions";
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

  forgetStoredAfterSave(userId, ["intentions","events","projects"]);
  redirect("/dashboard");
}
