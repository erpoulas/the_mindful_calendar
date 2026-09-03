import { z } from "zod";

export const AddAffirmationSchema = z.object({
  text: z.string().trim().min(1, "Text is required"),
});

export const SetTodayAffirmationSchema = z.object({
  text: z.string().trim().min(1, "Text is required"),
});
