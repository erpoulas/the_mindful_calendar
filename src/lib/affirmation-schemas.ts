import { z } from "zod";

export const AddAffirmationSchema = z.object({
  text: z.string().trim().min(1, "Text is required"),
});

/** How long a chosen affirmation shows before random picks return. */
export const KEEP_AFFIRMATION_FOR = ["today", "week", "month", "forever"] as const;

export type KeepAffirmationFor = (typeof KEEP_AFFIRMATION_FOR)[number];

export const KEEP_AFFIRMATION_LABELS: Record<KeepAffirmationFor, string> = {
  today: "Just today",
  week: "For a week",
  month: "For a month",
  forever: "Until I change it",
};

export const SetTodayAffirmationSchema = z.object({
  text: z.string().trim().min(1, "Text is required"),
  keepFor: z.enum(KEEP_AFFIRMATION_FOR),
});
