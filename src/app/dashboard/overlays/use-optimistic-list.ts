"use client";

import { useOptimistic } from "react";
import { applyListChange, type ListChange } from "@/lib/optimistic-list";

/**
 * The list as it should look right now: the server's list plus any clicks
 * still being saved. Call `change` inside a form action (or a transition);
 * when the save finishes, the server's fresh list takes over.
 */
export function useOptimisticList<Item extends { id: string; done?: boolean; text?: string }>(
  items: Item[],
) {
  return useOptimistic(items, (current: Item[], change: ListChange<Item>) =>
    applyListChange(current, change),
  );
}

/**
 * Runs a save, keeping a failure on this screen: the optimistic change then
 * undoes itself instead of the whole popup being replaced by an error page.
 * Returns whether the save worked.
 */
export async function saveInBackground(save: () => Promise<unknown>) {
  try {
    await save();
    return true;
  } catch (error) {
    console.error("Could not save the change", error);
    return false;
  }
}
