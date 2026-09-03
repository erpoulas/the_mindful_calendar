import { z } from "zod";

export const CreateSeasonSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

export const ReflectOnSeasonSchema = z.object({
  reflectionText: z.string().trim().min(1, "Write something before saving"),
});
