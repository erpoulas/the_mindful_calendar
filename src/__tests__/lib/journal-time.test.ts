import { describe, expect, it } from "vitest";
import {
  describeJournalSchedule,
  fromGoogleRecurringEvent,
  journalTimeOccurrences,
  journalTimeTitle,
  toGoogleRecurringBody,
  toJournalTimeSchedule,
} from "@/lib/journal-time";

const GRATITUDE = {
  journalId: "j1",
  journalName: "Gratitude",
  weekdays: [1, 3, 5],
  startMinutes: 21 * 60,
  durationMinutes: 20,
  startsOn: new Date("2026-11-01T00:00:00Z"),
};
// Mon 16 Nov to Mon 23 Nov 2026, as wall-clock times.
const WEEK = { start: new Date("2026-11-16T00:00:00Z"), end: new Date("2026-11-23T00:00:00Z") };

describe("journalTimeTitle", () => {
  it("names the event after the journal", () => {
    expect(journalTimeTitle("Gratitude")).toBe("Gratitude journal time");
  });
});

describe("journalTimeOccurrences", () => {
  it("puts a journal time on each scheduled day in the range", () => {
    const times = journalTimeOccurrences([GRATITUDE], WEEK);

    expect(times.map((time) => time.startAt.toISOString())).toEqual([
      "2026-11-16T21:00:00.000Z",
      "2026-11-18T21:00:00.000Z",
      "2026-11-20T21:00:00.000Z",
    ]);
    expect(times[0]).toMatchObject({
      journalId: "j1",
      title: "Gratitude journal time",
      endAt: new Date("2026-11-16T21:20:00.000Z"),
    });
  });

  it("gives each one its own id, and handles Sunday as day 7", () => {
    const times = journalTimeOccurrences([{ ...GRATITUDE, weekdays: [7] }], WEEK);

    expect(times).toHaveLength(1);
    expect(times[0].id).toBe("journal-time-j1-2026-11-22");
  });

  it("starts on the day the schedule was set up", () => {
    const times = journalTimeOccurrences([{ ...GRATITUDE, startsOn: new Date("2026-11-18T00:00:00Z") }], WEEK);

    expect(times.map((time) => time.startAt.getUTCDate())).toEqual([18, 20]);
  });

  it("covers a month view's whole range", () => {
    const sixWeeks = { start: WEEK.start, end: new Date("2026-12-28T00:00:00Z") };

    expect(journalTimeOccurrences([{ ...GRATITUDE, weekdays: [1, 2, 3, 4, 5, 6, 7] }], sixWeeks)).toHaveLength(42);
  });
});

describe("describeJournalSchedule", () => {
  it("lists the days, time and length", () => {
    expect(describeJournalSchedule(GRATITUDE)).toBe("Mon, Wed, Fri at 9:00 PM · 20 min");
  });

  it("says every day, or weekdays, when that's what it is", () => {
    expect(describeJournalSchedule({ ...GRATITUDE, weekdays: [1, 2, 3, 4, 5, 6, 7] })).toBe(
      "Every day at 9:00 PM · 20 min",
    );
    expect(describeJournalSchedule({ ...GRATITUDE, weekdays: [1, 2, 3, 4, 5], startMinutes: 7 * 60 + 30 })).toBe(
      "Weekdays at 7:30 AM · 20 min",
    );
  });

  it("writes an hour or more in hours", () => {
    expect(describeJournalSchedule({ ...GRATITUDE, durationMinutes: 90 })).toBe(
      "Mon, Wed, Fri at 9:00 PM · 1 hr 30 min",
    );
  });
});

describe("toGoogleRecurringBody", () => {
  it("is one weekly repeating event in the user's zone, from the first scheduled day it was set up", () => {
    // Set up on Thursday 19 Nov 2026.
    const schedule = { ...GRATITUDE, startsOn: new Date("2026-11-19T00:00:00Z") };

    expect(toGoogleRecurringBody(schedule, "America/New_York")).toEqual({
      summary: "Gratitude journal time",
      start: { dateTime: "2026-11-20T21:00:00", timeZone: "America/New_York" },
      end: { dateTime: "2026-11-20T21:20:00", timeZone: "America/New_York" },
      recurrence: ["RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR"],
    });
  });

  it("can start on the day it was set up", () => {
    const schedule = { ...GRATITUDE, startsOn: new Date("2026-11-20T00:00:00Z") };

    expect(toGoogleRecurringBody(schedule, "America/New_York").start).toEqual({
      dateTime: "2026-11-20T21:00:00",
      timeZone: "America/New_York",
    });
  });
});

describe("toJournalTimeSchedule", () => {
  it("starts on the wall-clock day the schedule was made, in the user's zone", () => {
    const schedule = toJournalTimeSchedule(
      {
        journalId: "j1",
        weekdays: [1],
        startMinutes: 60,
        durationMinutes: 10,
        // 11pm on 19 Nov in New York.
        createdAt: new Date("2026-11-20T04:00:00Z"),
        journal: { name: "Gratitude" },
      },
      "America/New_York",
    );

    expect(schedule).toMatchObject({ journalName: "Gratitude", startsOn: new Date("2026-11-19T00:00:00Z") });
  });
});

describe("fromGoogleRecurringEvent", () => {
  const NEW_YORK = "America/New_York";
  /** A repeating event as Google sends it back: times with an offset. */
  function recurring(
    rule: string,
    start = "2026-11-16T21:00:00-05:00",
    end = "2026-11-16T21:20:00-05:00",
    timeZone = NEW_YORK,
  ) {
    return {
      id: "g1",
      status: "confirmed",
      start: { dateTime: start, timeZone },
      end: { dateTime: end, timeZone },
      recurrence: [rule],
    };
  }

  it("reads back what toGoogleRecurringBody sent", () => {
    const sent = toGoogleRecurringBody(GRATITUDE, NEW_YORK);
    expect(fromGoogleRecurringEvent({ id: "g1", ...sent }, NEW_YORK)).toEqual({
      weekdays: [1, 3, 5],
      startMinutes: 21 * 60,
      durationMinutes: 20,
    });
  });

  it("reads the days, start time and length of an event edited in Google", () => {
    const event = recurring(
      "RRULE:FREQ=WEEKLY;WKST=SU;BYDAY=TU,TH",
      "2026-11-17T07:30:00-05:00",
      "2026-11-17T08:15:00-05:00",
    );
    expect(fromGoogleRecurringEvent(event, NEW_YORK)).toEqual({
      weekdays: [2, 4],
      startMinutes: 7 * 60 + 30,
      durationMinutes: 45,
    });
  });

  it("reads a daily event as every day", () => {
    expect(fromGoogleRecurringEvent(recurring("RRULE:FREQ=DAILY"), NEW_YORK)?.weekdays).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
  });

  it("reads a weekly event with no days listed as the day it starts on", () => {
    expect(fromGoogleRecurringEvent(recurring("RRULE:FREQ=WEEKLY"), NEW_YORK)?.weekdays).toEqual([1]);
  });

  it("gives the time on the user's clock when the event is in another zone", () => {
    // 9pm Monday in Los Angeles is midnight Tuesday in New York.
    const event = recurring(
      "RRULE:FREQ=WEEKLY;BYDAY=MO,SU",
      "2026-11-16T21:00:00-08:00",
      "2026-11-16T21:30:00-08:00",
      "America/Los_Angeles",
    );
    expect(fromGoogleRecurringEvent(event, NEW_YORK)).toEqual({
      weekdays: [1, 2],
      startMinutes: 0,
      durationMinutes: 30,
    });
  });

  it.each([
    ["every other week", "RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO"],
    ["ending on a date", "RRULE:FREQ=WEEKLY;UNTIL=20261231T000000Z;BYDAY=MO"],
    ["ending after a count", "RRULE:FREQ=WEEKLY;COUNT=5;BYDAY=MO"],
    ["monthly", "RRULE:FREQ=MONTHLY;BYDAY=1MO"],
  ])("gives null for a repeat the app can't hold (%s)", (_, rule) => {
    expect(fromGoogleRecurringEvent(recurring(rule), NEW_YORK)).toBeNull();
  });

  it("gives null for an all-day event, one with no repeat, or a length outside the app's limits", () => {
    expect(
      fromGoogleRecurringEvent(
        { id: "g1", start: { date: "2026-11-16" }, end: { date: "2026-11-17" }, recurrence: ["RRULE:FREQ=DAILY"] },
        NEW_YORK,
      ),
    ).toBeNull();
    expect(fromGoogleRecurringEvent({ ...recurring("RRULE:FREQ=DAILY"), recurrence: undefined }, NEW_YORK)).toBeNull();
    expect(
      fromGoogleRecurringEvent(
        recurring("RRULE:FREQ=DAILY", "2026-11-16T09:00:00-05:00", "2026-11-16T23:00:00-05:00"),
        NEW_YORK,
      ),
    ).toBeNull();
  });
});
