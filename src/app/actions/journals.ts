"use server";

import { redirect } from "next/navigation";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import {
  AddJournalPromptSchema,
  CreateJournalEntrySchema,
  CreateJournalSchema,
  UpdateJournalEntrySchema,
} from "@/lib/journal-schemas";
import {
  addJournalPrompt,
  createJournal,
  createJournalEntry,
  deleteJournal,
  deleteJournalEntry,
  deleteJournalPrompt,
  updateJournal,
  updateJournalEntry,
} from "@/lib/journals";
import { getCurrentUserId } from "@/lib/auth";
import { forgetStoredAfterSave } from "@/lib/stored-results";
import { db } from "@/lib/db";

// Everything here runs from the journal's one screen: boxes typed into right
// on the popup, which skip an empty name, so an invalid one is just ignored.

/** Creates a journal and opens its tab in the same popup. */
export async function createJournalAction(formData: FormData) {
  const validated = CreateJournalSchema.safeParse({ name: formData.get("name") });
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  const journal = await createJournal(db, { userId, name: validated.data.name });

  forgetStoredAfterSave(userId, ["journals"]);
  redirect(dashboardRoutes.journals(journal.id));
}

/** Renames a journal, keeping the popup open on it. */
export async function updateJournalAction(journalId: string, formData: FormData) {
  const validated = CreateJournalSchema.safeParse({ name: formData.get("name") });
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  await updateJournal(db, { userId, journalId, name: validated.data.name });

  forgetStoredAfterSave(userId, ["journals"]);
}

/** Deletes a journal and moves on to the first one left, in the same popup. */
export async function deleteJournalAction(journalId: string) {
  const userId = await getCurrentUserId();
  await deleteJournal(db, { userId, journalId });

  forgetStoredAfterSave(userId, ["journals"]);
  redirect(dashboardRoutes.journals());
}

export async function addJournalPromptAction(journalId: string, formData: FormData) {
  const validated = AddJournalPromptSchema.safeParse({ text: formData.get("text") });
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  await addJournalPrompt(db, { userId, journalId, text: validated.data.text });

  forgetStoredAfterSave(userId, ["journals"]);
}

export async function deleteJournalPromptAction(promptId: string) {
  const userId = await getCurrentUserId();
  await deleteJournalPrompt(db, { userId, promptId });

  forgetStoredAfterSave(userId, ["journals"]);
}

/** Saves a new entry; it then shows at the top of the entries below the box. */
export async function createJournalEntryAction(journalId: string, formData: FormData) {
  const rawStartAt = formData.get("startAt");

  const validated = CreateJournalEntrySchema.safeParse({
    promptText: formData.get("promptText") || undefined,
    content: formData.get("content") || undefined,
    startAt: rawStartAt && String(rawStartAt).trim() !== "" ? `${rawStartAt}:00Z` : undefined,
  });
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  await createJournalEntry(db, {
    userId,
    journalId,
    promptText: validated.data.promptText,
    content: validated.data.content,
    startAt: validated.data.startAt ? new Date(validated.data.startAt) : undefined,
  });

  forgetStoredAfterSave(userId, ["journals", "events", "intentions"]);
}

/**
 * Saves an edit to an entry's text ("content") or its prompt ("promptText"),
 * whichever the form holds. Clearing the text keeps the entry, now blank;
 * clearing the prompt removes it.
 */
export async function updateJournalEntryAction(entryId: string, formData: FormData) {
  const field = (name: string) => (formData.has(name) ? String(formData.get(name)) : undefined);
  const validated = UpdateJournalEntrySchema.safeParse({
    content: field("content"),
    promptText: field("promptText"),
  });
  if (!validated.success) return;
  const { content, promptText } = validated.data;

  const userId = await getCurrentUserId();
  await updateJournalEntry(db, {
    userId,
    entryId,
    content,
    promptText: promptText === undefined ? undefined : promptText || null,
  });

  // A new prompt also renames the entry's calendar event.
  forgetStoredAfterSave(userId, promptText === undefined ? ["journals"] : ["journals", "events"]);
}

export async function deleteJournalEntryAction(entryId: string) {
  const userId = await getCurrentUserId();
  await deleteJournalEntry(db, { userId, entryId });

  forgetStoredAfterSave(userId, ["journals", "events"]);
}
