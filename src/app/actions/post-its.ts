"use server";

import { CreatePostItSchema } from "@/lib/post-it-schemas";
import {
  createPostIt,
  deletePostIt,
  promoteQuickListItemToPostIt,
  reorderPostIts,
  updatePostItText,
} from "@/lib/post-its";
import { getCurrentUserId } from "@/lib/auth";
import { forgetStoredAfterSave } from "@/lib/stored-results";
import { db } from "@/lib/db";

export async function createPostItAction(formData: FormData) {
  const validated = CreatePostItSchema.safeParse({ text: formData.get("text") });
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  await createPostIt(db, { userId, text: validated.data.text });

  forgetStoredAfterSave(userId, ["postIts"]);
}

export async function promoteQuickListItemToPostItAction(itemId: string) {
  const userId = await getCurrentUserId();
  await promoteQuickListItemToPostIt(db, { userId, itemId });

  forgetStoredAfterSave(userId, ["postIts","quickLists"]);
}

// Edits use the same text rules as creating a post-it.
export async function updatePostItTextAction(postItId: string, formData: FormData) {
  const validated = CreatePostItSchema.safeParse({ text: formData.get("text") });
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  await updatePostItText(db, { userId, postItId, text: validated.data.text });

  forgetStoredAfterSave(userId, ["postIts"]);
}

export async function deletePostItAction(postItId: string) {
  const userId = await getCurrentUserId();
  await deletePostIt(db, { userId, postItId });

  forgetStoredAfterSave(userId, ["postIts"]);
}

export async function reorderPostItsAction(orderedIds: string[]) {
  const userId = await getCurrentUserId();
  await reorderPostIts(db, { userId, orderedIds });

  forgetStoredAfterSave(userId, ["postIts"]);
}
