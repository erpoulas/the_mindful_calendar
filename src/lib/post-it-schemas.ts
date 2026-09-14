import { z } from "zod";

export const CreatePostItSchema = z.object({
  text: z.string().trim().min(1, "Text is required"),
});
