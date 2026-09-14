import { z } from "zod";

const validTimezones = new Set(Intl.supportedValuesOf("timeZone"));

export const UpdateTimezoneSchema = z.object({
  timezone: z.string().refine((tz) => validTimezones.has(tz), "Not a recognized timezone"),
});
