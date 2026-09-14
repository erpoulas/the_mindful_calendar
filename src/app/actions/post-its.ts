"use server";

import { revalidatePath } from "next/cache";
import { promoteQuickListItemToPostIt } from "@/lib/post-its";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";

export async function promoteQuickListItemToPostItAction(itemId: string) {
  const userId = await getCurrentUserId();
  await promoteQuickListItemToPostIt(db, { userId, itemId });

  revalidatePath("/dashboard");
}
