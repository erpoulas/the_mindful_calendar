"use server";

import { refresh, revalidatePath } from "next/cache";
import { AddAffirmationSchema, SetTodayAffirmationSchema } from "@/lib/affirmation-schemas";
import {
  addAffirmation,
  deleteAffirmation,
  setTodayAffirmation,
} from "@/lib/affirmations";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";

export async function addAffirmationAction(formData: FormData) {
  const validated = AddAffirmationSchema.safeParse({ text: formData.get("text") });
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  await addAffirmation(db, { userId, text: validated.data.text });

  revalidatePath("/affirmations");
}

export async function deleteAffirmationAction(affirmationId: string) {
  const userId = await getCurrentUserId();
  await deleteAffirmation(db, { userId, affirmationId });

  revalidatePath("/affirmations");
}

export async function setTodayAffirmationAction(formData: FormData) {
  const validated = SetTodayAffirmationSchema.safeParse({ text: formData.get("text") });
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  await setTodayAffirmation(db, { userId, text: validated.data.text });

  revalidatePath("/affirmations");
}

export async function pickAffirmationAction() {
  refresh();
}
