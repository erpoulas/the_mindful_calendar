"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AddQuickListItemSchema, CreateQuickListSchema } from "@/lib/quick-list-schemas";
import {
  addQuickListItem,
  createQuickList,
  deleteQuickList,
  toggleQuickListItem,
  updateQuickList,
} from "@/lib/quick-lists";
import { getCurrentUserId } from "@/lib/auth";
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

  revalidatePath("/quicklists");
  redirect(`/quicklists/${list.id}`);
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

  revalidatePath("/quicklists");
  redirect(`/quicklists/${quickListId}`);
}

export async function deleteQuickListAction(quickListId: string) {
  const userId = await getCurrentUserId();
  await deleteQuickList(db, { userId, quickListId });

  revalidatePath("/quicklists");
  redirect("/quicklists");
}

export async function addQuickListItemAction(quickListId: string, formData: FormData) {
  const validated = AddQuickListItemSchema.safeParse({ text: formData.get("text") });
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  await addQuickListItem(db, { userId, quickListId, text: validated.data.text });

  revalidatePath(`/quicklists/${quickListId}`);
}

export async function toggleQuickListItemAction(itemId: string, quickListId: string) {
  const userId = await getCurrentUserId();
  await toggleQuickListItem(db, { userId, itemId });

  revalidatePath(`/quicklists/${quickListId}`);
}
