"use server";

import { refresh, revalidatePath } from "next/cache";
import { AddDopamineMenuItemSchema } from "@/lib/dopamine-menu-schemas";
import { addDopamineMenuItem, deleteDopamineMenuItem } from "@/lib/dopamine-menu";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";

export async function addDopamineMenuItemAction(formData: FormData) {
  const validated = AddDopamineMenuItemSchema.safeParse({ text: formData.get("text") });
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  await addDopamineMenuItem(db, { userId, text: validated.data.text });

  revalidatePath("/dopamine-menu");
}

export async function deleteDopamineMenuItemAction(itemId: string) {
  const userId = await getCurrentUserId();
  await deleteDopamineMenuItem(db, { userId, itemId });

  revalidatePath("/dopamine-menu");
}

export async function pickDopamineMenuItemAction() {
  refresh();
}
