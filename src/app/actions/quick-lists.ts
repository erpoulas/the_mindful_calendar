"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { AddQuickListItemSchema, CreateQuickListSchema } from "@/lib/quick-list-schemas";
import {
  addQuickListItem,
  createQuickList,
  deleteQuickList,
  toggleQuickListItem,
  updateQuickList,
} from "@/lib/quick-lists";
import { getCurrentUserId } from "@/lib/auth";
import { forgetStoredAfterSave } from "@/lib/stored-results";
import { db } from "@/lib/db";

export type QuickListFormState =
  | { errors?: { name?: string[] } }
  | undefined;

export async function createQuickListAction(
  _state: QuickListFormState,
  formData: FormData,
): Promise<QuickListFormState> {
  const validated = CreateQuickListSchema.safeParse({ name: formData.get("name") });
  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const userId = await getCurrentUserId();
  const list = await createQuickList(db, { userId, name: validated.data.name });

  forgetStoredAfterSave(userId, ["quickLists"]);
  redirect(dashboardRoutes.quickLists(list.id));
}

export async function updateQuickListAction(
  quickListId: string,
  _state: QuickListFormState,
  formData: FormData,
): Promise<QuickListFormState> {
  const validated = CreateQuickListSchema.safeParse({ name: formData.get("name") });
  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const userId = await getCurrentUserId();
  await updateQuickList(db, { userId, quickListId, name: validated.data.name });

  forgetStoredAfterSave(userId, ["quickLists"]);
  redirect("/dashboard");
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
