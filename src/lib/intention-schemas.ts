import { z } from "zod";
import { INTENTION_COLOR_KEYS } from "./intention-colors";

export const CreateIntentionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  // Only Google Calendar's colors, so synced events keep their color there.
  color: z.enum(INTENTION_COLOR_KEYS, "Pick one of the colors").optional(),
});
