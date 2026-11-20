import type { DbClient } from "./db";
import { markGoogleEventsForReread } from "./google-sync";

export type CalendarDisplaySettings = {
  extraTimezones: string[];
  use24HourClock: boolean;
};

export type UserSettings = CalendarDisplaySettings & {
  /** null until the user (or their browser) has picked one. */
  timezone: string | null;
};

/**
 * All of a user's settings in one read, with defaults for anything never
 * saved. Pages that need both the timezone and the display settings should
 * use this instead of reading the same row twice.
 */
export async function getUserSettings(client: DbClient, userId: string): Promise<UserSettings> {
  const settings = await client.userSettings.findUnique({ where: { userId } });
  return {
    timezone: settings?.timezone ?? null,
    extraTimezones: settings?.extraTimezones ?? [],
    use24HourClock: settings?.use24HourClock ?? false,
  };
}

export async function getUserTimezone(client: DbClient, userId: string): Promise<string | null> {
  return (await getUserSettings(client, userId)).timezone;
}

/** The saved timezone, or UTC for users who haven't picked one yet. */
export async function getUserTimezoneWithFallback(
  client: DbClient,
  userId: string,
): Promise<string> {
  return (await getUserTimezone(client, userId)) ?? "UTC";
}

/** Extra time zones and clock style for the calendar; defaults for users who never saved them. */
export async function getCalendarDisplaySettings(
  client: DbClient,
  userId: string,
): Promise<CalendarDisplaySettings> {
  const { extraTimezones, use24HourClock } = await getUserSettings(client, userId);
  return { extraTimezones, use24HourClock };
}

export async function setCalendarDisplaySettings(
  client: DbClient,
  params: { userId: string } & CalendarDisplaySettings,
) {
  const { userId, ...display } = params;
  return client.userSettings.upsert({
    where: { userId },
    create: { userId, ...display },
    update: display,
  });
}

export async function setUserTimezone(
  client: DbClient,
  params: { userId: string; timezone: string },
) {
  const previous = await getUserTimezone(client, params.userId);
  const settings = await client.userSettings.upsert({
    where: { userId: params.userId },
    create: { userId: params.userId, timezone: params.timezone },
    update: { timezone: params.timezone },
  });
  // Google events were saved in the old zone's wall-clock time.
  if (previous !== params.timezone) await markGoogleEventsForReread(client, params.userId);
  return settings;
}
