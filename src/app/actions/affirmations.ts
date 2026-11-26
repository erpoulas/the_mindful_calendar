"use server";

import { refresh } from "next/cache";
import { AddAffirmationSchema, SetTodayAffirmationSchema } from "@/lib/affirmation-schemas";
import {
  addAffirmation,
  clearTodayAffirmation,
  deleteAffirmation,
  keepAffirmationUntil,
  setTodayAffirmation,
} from "@/lib/affirmations";
import { getCurrentUserId } from "@/lib/auth";
import { storedTimezone } from "@/lib/stored-reads";
import { forgetStoredAfterSave } from "@/lib/stored-results";
import { db } from "@/lib/db";

export async function addAffirmationAction(formData: FormData) {
  const validated = AddAffirmationSchema.safeParse({ text: formData.get("text") });
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  await addAffirmation(db, { userId, text: validated.data.text });

  forgetStoredAfterSave(userId, ["affirmations"]);
}

export async function deleteAffirmationAction(affirmationId: string) {
  const userId = await getCurrentUserId();
  await deleteAffirmation(db, { userId, affirmationId });

  forgetStoredAfterSave(userId, ["affirmations"]);
}

export async function setTodayAffirmationAction(formData: FormData) {
  const validated = SetTodayAffirmationSchema.safeParse({
    text: formData.get("text"),
    keepFor: formData.get("keepFor"),
  });
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  const keepUntil = keepAffirmationUntil(validated.data.keepFor, await storedTimezone(userId));
  await setTodayAffirmation(db, { userId, text: validated.data.text, keepUntil });

  forgetStoredAfterSave(userId, ["affirmations"]);
}

export async function clearTodayAffirmationAction() {
  const userId = await getCurrentUserId();
  await clearTodayAffirmation(db, userId);

  forgetStoredAfterSave(userId, ["affirmations"]);
}

export async function pickAffirmationAction() {
  refresh();
}
