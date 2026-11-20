"use server";

import { reorderPanels, togglePanelVisibility } from "@/lib/dashboard-preferences";
import { getCurrentUserId } from "@/lib/auth";
import { forgetStoredAfterSave } from "@/lib/stored-results";
import { db } from "@/lib/db";

export async function togglePanelVisibilityAction(panelKey: string) {
  const userId = await getCurrentUserId();
  await togglePanelVisibility(db, { userId, panelKey });

  forgetStoredAfterSave(userId, ["preferences"]);
}

export async function reorderPanelsAction(orderedKeys: string[]) {
  const userId = await getCurrentUserId();
  await reorderPanels(db, { userId, orderedKeys });

  forgetStoredAfterSave(userId, ["preferences"]);
}
