"use server";

import { revalidatePath } from "next/cache";
import { togglePanelVisibility } from "@/lib/dashboard-preferences";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";

export async function togglePanelVisibilityAction(panelKey: string) {
  const userId = await getCurrentUserId();
  await togglePanelVisibility(db, { userId, panelKey });

  revalidatePath("/dashboard");
}
