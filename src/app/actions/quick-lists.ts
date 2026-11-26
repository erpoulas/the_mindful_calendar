"use server";

import { redirect } from "next/navigation";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { AddQuickListItemSchema, CreateQuickListSchema } from "@/lib/quick-list-schemas";
import {
  addQuickListItem,
  createQuickList,
  deleteQuickList,
  deleteQuickListItem,
  toggleQuickListItem,
  updateQuickList,
  updateQuickListItemText,
} from "@/lib/quick-lists";
import { getCurrentUserId } from "@/lib/auth";
import { forgetStoredAfterSave } from "@/lib/stored-results";
import { db } from "@/lib/db";

// Both run from boxes typed into right on the popup, which ignore an empty
// name, so an invalid one is just skipped.

/** Creates a list and opens it in the same popup. */
export async function createQuickListAction(formData: FormData) {
  const validated = CreateQuickListSchema.safeParse({ name: formData.get("name") });
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  const list = await createQuickList(db, { userId, name: validated.data.name });

  forgetStoredAfterSave(userId, ["quickLists"]);
  redirect(dashboardRoutes.quickLists(list.id));
}

/** Renames a list, keeping the popup open on it. */
export async function updateQuickListAction(quickListId: string, formData: FormData) {
  const validated = CreateQuickListSchema.safeParse({ name: formData.get("name") });
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  await updateQuickList(db, { userId, quickListId, name: validated.data.name });

  forgetStoredAfterSave(userId, ["quickLists"]);
}

export async function deleteQuickListAction(quickListId: string) {
  const userId = await getCurrentUserId();
  await deleteQuickList(db, { userId, quickListId });

  forgetStoredAfterSave(userId, ["quickLists"]);
  redirect("/dashboard");
}

export async function addQuickListItemAction(quickListId: string, formData: FormData) {
  const validated = AddQuickListItemSchema.safeParse({ text: formData.get("text") });
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  await addQuickListItem(db, { userId, quickListId, text: validated.data.text });

  forgetStoredAfterSave(userId, ["quickLists"]);
}

export async function toggleQuickListItemAction(itemId: string, quickListId: string) {
  const userId = await getCurrentUserId();
  await toggleQuickListItem(db, { userId, itemId });

  forgetStoredAfterSave(userId, ["quickLists"]);
}

// Edits use the same text rules as adding an item.
export async function updateQuickListItemTextAction(itemId: string, formData: FormData) {
  const validated = AddQuickListItemSchema.safeParse({ text: formData.get("text") });
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  await updateQuickListItemText(db, { userId, itemId, text: validated.data.text });

  forgetStoredAfterSave(userId, ["quickLists"]);
}

export async function deleteQuickListItemAction(itemId: string) {
  const userId = await getCurrentUserId();
  await deleteQuickListItem(db, { userId, itemId });

  forgetStoredAfterSave(userId, ["quickLists"]);
}
