import { z } from "zod";

export const CreateQuickListSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

export const AddQuickListItemSchema = z.object({
  text: z.string().trim().min(1, "Item text is required"),
});
