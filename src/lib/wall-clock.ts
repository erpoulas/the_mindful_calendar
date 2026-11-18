/**
 * Calendar events are stored as wall-clock times in UTC fields: an event at
 * 9:00am is saved as 09:00Z no matter where the user lives. To compare "now"
 * with those events, convert the real current instant the same way: the
 * returned Date's UTC fields hold the wall-clock time in `timeZone`.
 */
export function toWallClockDate(instant: Date, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(instant);

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)!.value);

  return new Date(
    Date.UTC(
      part("year"),
      part("month") - 1,
      part("day"),
      part("hour"),
      part("minute"),
      part("second"),
    ),
  );
}
