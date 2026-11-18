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

const DAY_MS = 24 * 60 * 60 * 1000;

/** How far `timeZone`'s clock is from UTC at `instant`, e.g. -5h for New York in winter. */
function utcOffsetMs(instant: Date, timeZone: string): number {
  const wholeSeconds = Math.floor(instant.getTime() / 1000) * 1000;
  return toWallClockDate(new Date(wholeSeconds), timeZone).getTime() - wholeSeconds;
}

/**
 * The reverse of toWallClockDate: turns a stored wall-clock time in
 * `timeZone` back into the real moment it happens (needed when sending
 * events to services such as Google Calendar).
 *
 * Daylight saving makes two cases tricky, handled like most calendars do:
 * - A time skipped when clocks spring forward (2:30am) moves ahead by the
 *   gap, so it becomes 3:30am.
 * - A time that happens twice when clocks fall back (1:30am) uses the
 *   first one.
 */
export function fromWallClockDate(wallClock: Date, timeZone: string): Date {
  const wallClockMs = wallClock.getTime();
  // Clocks change at most a couple of times a year, so the offsets a day
  // before and a day after cover both sides of any change near this time.
  const offsetBefore = utcOffsetMs(new Date(wallClockMs - DAY_MS), timeZone);
  const offsetAfter = utcOffsetMs(new Date(wallClockMs + DAY_MS), timeZone);

  const candidates = [wallClockMs - offsetBefore, wallClockMs - offsetAfter];
  const matching = candidates.filter(
    (candidate) => candidate + utcOffsetMs(new Date(candidate), timeZone) === wallClockMs,
  );

  // No match means the time was skipped by spring-forward: reading it with
  // the pre-change offset lands it one gap later, e.g. 2:30am → 3:30am.
  if (matching.length === 0) return new Date(candidates[0]);
  return new Date(Math.min(...matching));
}
