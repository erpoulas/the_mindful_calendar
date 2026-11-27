import { z } from "zod";
import { DOPAMINE_COURSES } from "./dopamine-courses";

/** A course, or "" (or nothing) for none. */
export const DopamineCourseSchema = z
  .enum(DOPAMINE_COURSES)
  .or(z.literal(""))
  .nullish()
  .transform((course) => course || null);

export const AddDopamineMenuItemSchema = z.object({
  text: z.string().trim().min(1, "Text is required"),
  course: DopamineCourseSchema,
});
