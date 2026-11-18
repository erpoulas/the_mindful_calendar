import type { DbClient } from "./db";
import { markGoogleEventsForReread } from "./google-sync";

export async function getUserTimezone(client: DbClient, userId: string): Promise<string | null> {
  const settings = await client.userSettings.findUnique({ where: { userId } });
  return settings?.timezone ?? null;
}

/** The saved timezone, or UTC for users who haven't picked one yet. */
export async function getUserTimezoneWithFallback(
  client: DbClient,
  userId: string,
): Promise<string> {
  return (await getUserTimezone(client, userId)) ?? "UTC";
}

export type CalendarDisplaySettings = {
  extraTimezones: string[];
  use24HourClock: boolean;
};

/** Extra time zones and clock style for the calendar; defaults for users who never saved them. */
export async function getCalendarDisplaySettings(
  client: DbClient,
  userId: string,
): Promise<CalendarDisplaySettings> {
  const settings = await client.userSettings.findUnique({ where: { userId } });
  return {
    extraTimezones: settings?.extraTimezones ?? [],
    use24HourClock: settings?.use24HourClock ?? false,
  };
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
