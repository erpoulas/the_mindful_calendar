import { z } from "zod";

// Matches Google Calendar's own event title (summary) character limit.
export const TITLE_MAX_LENGTH = 1024;

export const CreateCalendarEventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(TITLE_MAX_LENGTH, `Keep it under ${TITLE_MAX_LENGTH} characters`),
    startAt: z.string().trim().optional(),
    endAt: z.string().trim().optional(),
    isAllDay: z.boolean().optional(),
    location: z.string().trim().optional(),
    notes: z.string().trim().optional(),
    projectId: z.string().trim().optional(),
    intentionIds: z.array(z.string()).optional(),
  })
  .refine(
    (data) => !data.startAt || !data.endAt || new Date(data.endAt) >= new Date(data.startAt),
    { error: "End time must be after start time", path: ["endAt"] },
  );
