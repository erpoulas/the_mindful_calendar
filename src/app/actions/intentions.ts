"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CreateIntentionSchema } from "@/lib/intention-schemas";
import { createIntention } from "@/lib/intentions";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";

export type IntentionFormState =
  | {
      errors?: {
        name?: string[];
        color?: string[];
      };
    }
  | undefined;

export async function createIntentionAction(
  _state: IntentionFormState,
  formData: FormData,
): Promise<IntentionFormState> {
  const rawColor = formData.get("color");

  const validated = CreateIntentionSchema.safeParse({
    name: formData.get("name"),
    color: rawColor && String(rawColor).trim() !== "" ? rawColor : undefined,
  });

  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const userId = await getCurrentUserId();
  await createIntention(db, { userId, ...validated.data });

  revalidatePath("/intentions");
}
