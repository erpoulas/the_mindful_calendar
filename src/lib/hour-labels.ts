import { fromWallClockDate, toWallClockDate } from "./wall-clock";

export type HourLabelColumn = {
  /** Offset name such as "GMT-6"; null when the main zone is the only column. */
  heading: string | null;
  /** One label per hour of the day, index 0 = midnight in the main zone. */
  labels: string[];
};

const HOUR_MS = 60 * 60 * 1000;

/** Formats a wall-clock Date's UTC fields as "9 AM" / "2:30 PM", or "09:00" / "14:30". */
export function formatClockTime(wallClock: Date, use24HourClock: boolean): string {
  const hours = wallClock.getUTCHours();
  const minutes = wallClock.getUTCMinutes();
  const paddedMinutes = String(minutes).padStart(2, "0");

  if (use24HourClock) return `${String(hours).padStart(2, "0")}:${paddedMinutes}`;

  const period = hours < 12 ? "AM" : "PM";
  const twelveHour = hours % 12 === 0 ? 12 : hours % 12;
  return minutes === 0 ? `${twelveHour} ${period}` : `${twelveHour}:${paddedMinutes} ${period}`;
}

/** "GMT-6", "GMT+5:30" or "GMT" for `timeZone` at the real moment `instant`. */
function offsetName(timeZone: string, instant: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" })
    .formatToParts(instant);
  return parts.find((part) => part.type === "timeZoneName")!.value;
}

/**
 * The hour labels down the side of the week view, one column per time zone.
 * Each hour row of `day` (a wall-clock midnight in `timeZone`) is turned into
 * the real moment it happens, then read off each extra zone's clock. Extra
 * zones come first and the main zone last, so it sits next to the grid, as
 * in Google Calendar.
 */
export function buildHourLabelColumns(params: {
  day: Date;
  timeZone: string;
  extraTimeZones: string[];
  use24HourClock: boolean;
}): HourLabelColumn[] {
  const { day, timeZone, extraTimeZones, use24HourClock } = params;
  const showHeadings = extraTimeZones.length > 0;
  const realMoments = Array.from({ length: 24 }, (_, hour) =>
    fromWallClockDate(new Date(day.getTime() + hour * HOUR_MS), timeZone),
  );

  return [...extraTimeZones, timeZone].map((zone) => ({
    heading: showHeadings ? offsetName(zone, realMoments[12]) : null,
    labels: realMoments.map((moment) =>
      formatClockTime(toWallClockDate(moment, zone), use24HourClock),
    ),
  }));
}
