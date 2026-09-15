"use server";

import { revalidatePath } from "next/cache";
import { reorderPanels, togglePanelVisibility } from "@/lib/dashboard-preferences";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";

export async function togglePanelVisibilityAction(panelKey: string) {
  const userId = await getCurrentUserId();
  await togglePanelVisibility(db, { userId, panelKey });

  revalidatePath("/dashboard");
}

export async function reorderPanelsAction(orderedKeys: string[]) {
  const userId = await getCurrentUserId();
  await reorderPanels(db, { userId, orderedKeys });

  revalidatePath("/dashboard");
}
