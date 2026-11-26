"use server";

import { refresh } from "next/cache";
import { AddDopamineMenuItemSchema } from "@/lib/dopamine-menu-schemas";
import {
  addDopamineMenuItem,
  deleteDopamineMenuItem,
  setDopamineMenuItemIntention,
} from "@/lib/dopamine-menu";
import { getCurrentUserId } from "@/lib/auth";
import { forgetStoredAfterSave } from "@/lib/stored-results";
import { db } from "@/lib/db";

export async function addDopamineMenuItemAction(formData: FormData) {
  const validated = AddDopamineMenuItemSchema.safeParse({ text: formData.get("text") });
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  await addDopamineMenuItem(db, { userId, text: validated.data.text });

  forgetStoredAfterSave(userId, ["dopamineMenu"]);
}

export async function deleteDopamineMenuItemAction(itemId: string) {
  const userId = await getCurrentUserId();
  await deleteDopamineMenuItem(db, { userId, itemId });

  forgetStoredAfterSave(userId, ["dopamineMenu"]);
}

/** Tags a menu item with an intention ("" clears it). */
export async function setDopamineMenuItemIntentionAction(itemId: string, intentionId: string) {
  const userId = await getCurrentUserId();
  await setDopamineMenuItemIntention(db, { userId, itemId, intentionId: intentionId || null });

  forgetStoredAfterSave(userId, ["dopamineMenu"]);
}

export async function pickDopamineMenuItemAction() {
  refresh();
}
