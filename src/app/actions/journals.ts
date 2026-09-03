"use server";

import { redirect } from "next/navigation";
import { refresh, revalidatePath } from "next/cache";
import { z } from "zod";
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
import { db } from "@/lib/db";

export type JournalFormState = { errors?: { name?: string[] } } | undefined;

export async function createJournalAction(
  _state: JournalFormState,
  formData: FormData,
): Promise<JournalFormState> {
  const validated = CreateJournalSchema.safeParse({ name: formData.get("name") });
  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const userId = await getCurrentUserId();
  const journal = await createJournal(db, { userId, name: validated.data.name });

  revalidatePath("/journals");
  redirect(`/journals/${journal.id}`);
}

export async function updateJournalAction(
  journalId: string,
  _state: JournalFormState,
  formData: FormData,
): Promise<JournalFormState> {
  const validated = CreateJournalSchema.safeParse({ name: formData.get("name") });
  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const userId = await getCurrentUserId();
  await updateJournal(db, { userId, journalId, name: validated.data.name });

  revalidatePath("/journals");
  redirect(`/journals/${journalId}`);
}

export async function deleteJournalAction(journalId: string) {
  const userId = await getCurrentUserId();
  await deleteJournal(db, { userId, journalId });

  revalidatePath("/journals");
  redirect("/journals");
}

export async function addJournalPromptAction(journalId: string, formData: FormData) {
  const validated = AddJournalPromptSchema.safeParse({ text: formData.get("text") });
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  await addJournalPrompt(db, { userId, journalId, text: validated.data.text });

  revalidatePath(`/journals/${journalId}`);
}

export async function deleteJournalPromptAction(promptId: string, journalId: string) {
  const userId = await getCurrentUserId();
  await deleteJournalPrompt(db, { userId, promptId });

  revalidatePath(`/journals/${journalId}`);
}

export async function pickJournalPromptAction() {
  refresh();
}

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

  revalidatePath(`/journals/${journalId}`);
  redirect(`/journals/${journalId}`);
}

export async function updateJournalEntryAction(
  entryId: string,
  journalId: string,
  formData: FormData,
) {
  const validated = UpdateJournalEntrySchema.safeParse({
    content: formData.get("content") || undefined,
  });
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  await updateJournalEntry(db, { userId, entryId, content: validated.data.content });

  revalidatePath(`/journals/${journalId}`);
  redirect(`/journals/${journalId}`);
}

export async function deleteJournalEntryAction(entryId: string, journalId: string) {
  const userId = await getCurrentUserId();
  await deleteJournalEntry(db, { userId, entryId });

  revalidatePath(`/journals/${journalId}`);
  redirect(`/journals/${journalId}`);
}
