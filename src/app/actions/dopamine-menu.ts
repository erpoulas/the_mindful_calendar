"use server";

import { AddDopamineMenuItemSchema, DopamineCourseSchema } from "@/lib/dopamine-menu-schemas";
import {
  addDopamineMenuItem,
  deleteDopamineMenuItem,
  setDopamineMenuItemCourse,
  setDopamineMenuItemIntention,
  updateDopamineMenuItemText,
} from "@/lib/dopamine-menu";
import { getCurrentUserId } from "@/lib/auth";
import { forgetStoredAfterSave } from "@/lib/stored-results";
import { db } from "@/lib/db";

/** Adds an item, under the course whose blank line it was typed on (if any). */
export async function addDopamineMenuItemAction(formData: FormData) {
  const validated = AddDopamineMenuItemSchema.safeParse({
    text: formData.get("text"),
    course: formData.get("course"),
  });
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  await addDopamineMenuItem(db, { userId, ...validated.data });

  forgetStoredAfterSave(userId, ["dopamineMenu"]);
}

export async function deleteDopamineMenuItemAction(itemId: string) {
  const userId = await getCurrentUserId();
  await deleteDopamineMenuItem(db, { userId, itemId });

  forgetStoredAfterSave(userId, ["dopamineMenu"]);
}

/** Saves an item's text after it's edited in place. */
export async function updateDopamineMenuItemTextAction(itemId: string, formData: FormData) {
  const validated = AddDopamineMenuItemSchema.pick({ text: true }).safeParse({ text: formData.get("text") });
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  await updateDopamineMenuItemText(db, { userId, itemId, text: validated.data.text });

  forgetStoredAfterSave(userId, ["dopamineMenu"]);
}

/** Tags a menu item with an intention ("" clears it). */
export async function setDopamineMenuItemIntentionAction(itemId: string, intentionId: string) {
  const userId = await getCurrentUserId();
  await setDopamineMenuItemIntention(db, { userId, itemId, intentionId: intentionId || null });

  forgetStoredAfterSave(userId, ["dopamineMenu"]);
}

/** Moves a menu item to a course ("" takes it off to "Anytime"). */
export async function setDopamineMenuItemCourseAction(itemId: string, course: string) {
  const validated = DopamineCourseSchema.safeParse(course);
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  await setDopamineMenuItemCourse(db, { userId, itemId, course: validated.data });

  forgetStoredAfterSave(userId, ["dopamineMenu"]);
}
