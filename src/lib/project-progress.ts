// Pure helpers for how far along a project is: time put in, the due-date
// countdown and how long a finished project took. No database here; the
// popup hands in what it read.

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

type Session = { startAt: Date; endAt: Date };

/**
 * Minutes put into a project this week and in all, from its calendar
 * sessions. Only time already spent counts: a session going on now counts up
 * to now, and later ones not at all. Every date here is wall-clock (convert
 * "now" with toWallClockDate first), like stored event times.
 */
export function summarizeProjectTime(
  sessions: Session[],
  { now, weekStart, weekEnd }: { now: Date; weekStart: Date; weekEnd: Date },
) {
  let weekMinutes = 0;
  let totalMinutes = 0;
  for (const { startAt, endAt } of sessions) {
    const spentUntil = Math.min(endAt.getTime(), now.getTime());
    const minutes = Math.max(0, Math.round((spentUntil - startAt.getTime()) / MINUTE));
    totalMinutes += minutes;
    if (startAt >= weekStart && startAt < weekEnd) weekMinutes += minutes;
  }
  return { weekMinutes, totalMinutes };
}

/** E.g. "45m", "1h", "2h 30m". */
export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/**
 * The due date as a countdown: "9 days to go", "Due tomorrow", "Due today",
 * "2 days past due". `soon` marks the last three days and anything past, so
 * the popup can tint it. Both dates are calendar days at midnight UTC (see
 * project-due-date.ts); `today` is the user's today in their time zone.
 */
export function describeDueDate(dueDate: Date, today: Date) {
  const daysLeft = Math.round((dueDate.getTime() - today.getTime()) / DAY);
  const soon = daysLeft <= 3;
  if (daysLeft > 1) return { label: `${plural(daysLeft, "day")} to go`, soon };
  if (daysLeft === 1) return { label: "Due tomorrow", soon };
  if (daysLeft === 0) return { label: "Due today", soon };
  return { label: `${plural(-daysLeft, "day")} past due`, soon };
}

function startOfDay(date: Date | number) {
  const time = typeof date === "number" ? date : date.getTime();
  return time - (time % DAY);
}

/**
 * A gentle nudge for a project that's gone quiet: "Last worked on 5 days
 * ago", from its latest past calendar session or ticked-off task. Null once
 * there's been work this week (the time put in already shows that), or
 * before there's been any. All dates are wall-clock: convert task
 * completedAt moments with toWallClockDate first.
 */
export function describeLastWorked(
  sessions: Session[],
  taskTicks: Date[],
  { now, weekStart }: { now: Date; weekStart: Date },
) {
  let last: number | null = null;
  const consider = (time: number) => {
    if (time <= now.getTime() && (last === null || time > last)) last = time;
  };
  for (const { startAt, endAt } of sessions) {
    if (startAt <= now) consider(Math.min(endAt.getTime(), now.getTime()));
  }
  for (const tick of taskTicks) consider(tick.getTime());
  if (last === null || last >= weekStart.getTime()) return null;

  const daysAgo = Math.round((startOfDay(now) - startOfDay(last)) / DAY);
  return `Last worked on ${daysAgo === 1 ? "yesterday" : `${plural(daysAgo, "day")} ago`}`;
}

/** How many days a project ran, counting any started day (at least 1). */
export function wholeDaysBetween(start: Date, end: Date) {
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / DAY));
}
