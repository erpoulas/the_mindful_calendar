import { z } from "zod";
import { TITLE_MAX_LENGTH } from "./calendar-event-schemas";

// A post-it's text becomes an event title when dragged onto a day, so it's
// held to the same limit (Google Calendar's own event title/summary cap).
export const CreatePostItSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Text is required")
    .max(TITLE_MAX_LENGTH, `Keep it under ${TITLE_MAX_LENGTH} characters`),
});
