import { z } from "zod";

export const CreateProjectSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  endGoal: z.string().trim().min(1, "End goal is required"),
  intentionIds: z.array(z.string()).min(1, "Pick at least one intention"),
  dueDate: z.string().trim().optional(),
});
