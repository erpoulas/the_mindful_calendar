import { z } from "zod";

const validTimezones = new Set(Intl.supportedValuesOf("timeZone"));

export const KnownTimezone = z.string().refine((tz) => validTimezones.has(tz), "Not a recognized timezone");

export const UpdateTimezoneSchema = z.object({
  timezone: KnownTimezone,
});

/** Most extra zones the week view has room for beside the hour labels. */
export const MAX_EXTRA_TIMEZONES = 3;

export const UpdateCalendarDisplaySchema = z
  .object({
    extraTimezones: z
      .array(KnownTimezone)
      .transform((zones) => [...new Set(zones)])
      .refine((zones) => zones.length <= MAX_EXTRA_TIMEZONES, {
        message: `Pick at most ${MAX_EXTRA_TIMEZONES} extra time zones`,
      }),
    clockFormat: z.enum(["12", "24"]),
  })
  .transform(({ extraTimezones, clockFormat }) => ({
    extraTimezones,
    use24HourClock: clockFormat === "24",
  }));
