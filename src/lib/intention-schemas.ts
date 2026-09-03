import { z } from "zod";

export const CreateIntentionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  color: z.string().trim().optional(),
});
