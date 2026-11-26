import type { GoogleApiEvent } from "./google-calendar";
import { toWallClockDate } from "./wall-clock";

// A journal's repeating writing time ("Gratitude journal time"), worked out
// from its schedule rather than stored as one event per day. Times are wall
// clock (see "Times and time zones" in AGENTS.md).

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const GOOGLE_DAY_CODES = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

/**
 * A journal's schedule: days 1 = Monday ... 7 = Sunday, times in minutes,
 * repeating from `startsOn` (the wall-clock day it was set up).
 */
export type JournalTimeSchedule = {
  journalId: string;
  journalName: string;
  weekdays: number[];
  startMinutes: number;
  durationMinutes: number;
  startsOn: Date;
};

/** A stored schedule (with its journal's name) as the calendar and the sync use it. */
export function toJournalTimeSchedule(
  row: {
    journalId: string;
    weekdays: number[];
    startMinutes: number;
    durationMinutes: number;
    createdAt: Date;
    journal: { name: string };
  },
  timeZone: string,
): JournalTimeSchedule {
  return {
    journalId: row.journalId,
    journalName: row.journal.name,
    weekdays: row.weekdays,
    startMinutes: row.startMinutes,
    durationMinutes: row.durationMinutes,
    startsOn: startOfDay(toWallClockDate(row.createdAt, timeZone)),
  };
}

function startOfDay(wallClock: Date) {
  return new Date(Math.floor(wallClock.getTime() / DAY_MS) * DAY_MS);
}

export type JournalTimeOccurrence = {
  id: string;
  journalId: string;
  title: string;
  startAt: Date;
  endAt: Date;
};

export function journalTimeTitle(journalName: string) {
  return `${journalName} journal time`;
}

/** 1 = Monday ... 7 = Sunday, for a wall-clock date. */
function weekdayOf(wallClock: Date) {
  return ((wallClock.getUTCDay() + 6) % 7) + 1;
}

/**
 * Each scheduled journal time between two wall-clock days (end not
 * included), from the day each schedule was set up on.
 */
export function journalTimeOccurrences(
  schedules: JournalTimeSchedule[],
  range: { start: Date; end: Date },
): JournalTimeOccurrence[] {
  const occurrences: JournalTimeOccurrence[] = [];
  const firstDay = Math.floor(range.start.getTime() / DAY_MS) * DAY_MS;

  for (let day = firstDay; day < range.end.getTime(); day += DAY_MS) {
    const date = new Date(day);
    for (const schedule of schedules) {
      if (date < schedule.startsOn || !schedule.weekdays.includes(weekdayOf(date))) continue;
      const startAt = new Date(day + schedule.startMinutes * MINUTE_MS);
      occurrences.push({
        id: `journal-time-${schedule.journalId}-${date.toISOString().slice(0, 10)}`,
        journalId: schedule.journalId,
        title: journalTimeTitle(schedule.journalName),
        startAt,
        endAt: new Date(startAt.getTime() + schedule.durationMinutes * MINUTE_MS),
      });
    }
  }
  return occurrences.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}

/** "9:00 PM" for minutes after midnight. */
function formatClockTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const suffix = hours < 12 ? "AM" : "PM";
  return `${hours % 12 || 12}:${String(minutes % 60).padStart(2, "0")} ${suffix}`;
}

function formatLength(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

/** A short summary, like "Mon, Wed, Fri at 9:00 PM · 20 min". */
export function describeJournalSchedule(
  schedule: Pick<JournalTimeSchedule, "weekdays" | "startMinutes" | "durationMinutes">,
) {
  const days = [...schedule.weekdays].sort((a, b) => a - b);
  const dayText =
    days.length === 7
      ? "Every day"
      : days.join() === "1,2,3,4,5"
        ? "Weekdays"
        : days.map((day) => DAY_NAMES[day - 1]).join(", ");
  return `${dayText} at ${formatClockTime(schedule.startMinutes)} · ${formatLength(schedule.durationMinutes)}`;
}

/** "2026-11-20T21:00:00": a wall-clock time as Google's local date-time text. */
function toGoogleDateTime(wallClock: Date) {
  return wallClock.toISOString().slice(0, 19);
}

/**
 * The schedule as one repeating Google event in the user's zone. It starts
 * on the first scheduled day from the day it was set up (a repeating
 * event's first time must itself be one of its days, or Google adds it as
 * an extra), so Google shows the same times as the app.
 */
export function toGoogleRecurringBody(
  schedule: JournalTimeSchedule,
  timeZone: string,
): Omit<GoogleApiEvent, "id"> {
  let firstDay = startOfDay(schedule.startsOn).getTime();
  while (!schedule.weekdays.includes(weekdayOf(new Date(firstDay)))) firstDay += DAY_MS;

  const startAt = new Date(firstDay + schedule.startMinutes * MINUTE_MS);
  const endAt = new Date(startAt.getTime() + schedule.durationMinutes * MINUTE_MS);
  const days = [...schedule.weekdays].sort((a, b) => a - b).map((day) => GOOGLE_DAY_CODES[day - 1]);

  return {
    summary: journalTimeTitle(schedule.journalName),
    start: { dateTime: toGoogleDateTime(startAt), timeZone },
    end: { dateTime: toGoogleDateTime(endAt), timeZone },
    recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${days.join(",")}`],
  };
}
