import { z } from "zod";

export const CreateJournalSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

export const AddJournalPromptSchema = z.object({
  text: z.string().trim().min(1, "Prompt text is required"),
});

export const CreateJournalEntrySchema = z.object({
  promptText: z.string().trim().optional(),
  content: z.string().trim().optional(),
  startAt: z.string().trim().optional(),
});

// Each field is left out when the edit doesn't touch it. An empty prompt
// (cleared away) removes it: see updateJournalEntryAction.
export const UpdateJournalEntrySchema = z.object({
  content: z.string().trim().optional(),
  promptText: z.string().trim().optional(),
});
