"use server";

import { revalidatePath } from "next/cache";
import { CreatePostItSchema } from "@/lib/post-it-schemas";
import { createPostIt, deletePostIt, promoteQuickListItemToPostIt } from "@/lib/post-its";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";

export async function createPostItAction(formData: FormData) {
  const validated = CreatePostItSchema.safeParse({ text: formData.get("text") });
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  await createPostIt(db, { userId, text: validated.data.text });

  revalidatePath("/dashboard");
}

export async function promoteQuickListItemToPostItAction(itemId: string) {
  const userId = await getCurrentUserId();
  await promoteQuickListItemToPostIt(db, { userId, itemId });

  revalidatePath("/dashboard");
}

export async function deletePostItAction(postItId: string) {
  const userId = await getCurrentUserId();
  await deletePostIt(db, { userId, postItId });

  revalidatePath("/dashboard");
}
