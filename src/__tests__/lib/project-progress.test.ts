import { describe, expect, it } from "vitest";
import {
  describeDueDate,
  describeLastWorked,
  formatDuration,
  summarizeProjectTime,
  wholeDaysBetween,
} from "@/lib/project-progress";

// All wall-clock times, like stored event times.
const week = {
  weekStart: new Date("2026-11-23T00:00:00Z"),
  weekEnd: new Date("2026-11-30T00:00:00Z"),
};

function session(start: string, end: string) {
  return { startAt: new Date(start), endAt: new Date(end) };
}

describe("summarizeProjectTime", () => {
  it("adds up this week's sessions and every session so far", () => {
    const sessions = [
      session("2026-11-10T09:00:00Z", "2026-11-10T12:00:00Z"), // last month: 3h
      session("2026-11-24T09:00:00Z", "2026-11-24T10:30:00Z"), // this week: 1h30
      session("2026-11-25T18:00:00Z", "2026-11-25T19:00:00Z"), // this week: 1h
    ];

    const time = summarizeProjectTime(sessions, { now: new Date("2026-11-26T12:00:00Z"), ...week });

    expect(time).toEqual({ weekMinutes: 150, totalMinutes: 330 });
  });

  it("counts a session in progress only up to now, and future sessions not at all", () => {
    const sessions = [
      session("2026-11-26T11:00:00Z", "2026-11-26T12:00:00Z"), // started 20 minutes ago
      session("2026-11-28T09:00:00Z", "2026-11-28T10:00:00Z"), // later this week
    ];

    const time = summarizeProjectTime(sessions, { now: new Date("2026-11-26T11:20:00Z"), ...week });

    expect(time).toEqual({ weekMinutes: 20, totalMinutes: 20 });
  });
});

describe("formatDuration", () => {
  it("reads like a person would say it", () => {
    expect(formatDuration(0)).toBe("0m");
    expect(formatDuration(45)).toBe("45m");
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(150)).toBe("2h 30m");
  });
});

describe("describeDueDate", () => {
  const today = new Date("2026-11-26T00:00:00Z");

  it("counts down the days, flagging the last three as soon", () => {
    expect(describeDueDate(new Date("2026-12-05T00:00:00Z"), today)).toEqual({ label: "9 days to go", soon: false });
    expect(describeDueDate(new Date("2026-11-29T00:00:00Z"), today)).toEqual({ label: "3 days to go", soon: true });
    expect(describeDueDate(new Date("2026-11-27T00:00:00Z"), today)).toEqual({ label: "Due tomorrow", soon: true });
    expect(describeDueDate(new Date("2026-11-26T00:00:00Z"), today)).toEqual({ label: "Due today", soon: true });
  });

  it("says gently how long ago a missed date was", () => {
    expect(describeDueDate(new Date("2026-11-25T00:00:00Z"), today)).toEqual({ label: "1 day past due", soon: true });
    expect(describeDueDate(new Date("2026-11-20T00:00:00Z"), today)).toEqual({ label: "6 days past due", soon: true });
  });
});

describe("wholeDaysBetween", () => {
  it("counts started days, never less than one", () => {
    expect(wholeDaysBetween(new Date("2026-10-10T08:00:00Z"), new Date("2026-11-26T20:00:00Z"))).toBe(48);
    expect(wholeDaysBetween(new Date("2026-11-26T08:00:00Z"), new Date("2026-11-26T09:00:00Z"))).toBe(1);
  });
});

describe("describeLastWorked", () => {
  const clock = { now: new Date("2026-11-26T15:00:00Z"), weekStart: week.weekStart };

  it("says how long ago the last session or ticked-off task was", () => {
    const sessions = [
      session("2026-11-10T09:00:00Z", "2026-11-10T10:00:00Z"),
      session("2026-11-21T18:00:00Z", "2026-11-21T19:00:00Z"), // last Saturday
    ];
    const taskTicks = [new Date("2026-11-15T12:00:00Z")];

    expect(describeLastWorked(sessions, taskTicks, clock)).toBe("Last worked on 5 days ago");
    expect(describeLastWorked([], [new Date("2026-11-22T23:00:00Z")], clock)).toBe("Last worked on 4 days ago");
  });

  it("stays quiet once there's been work this week, or before there's been any", () => {
    expect(describeLastWorked([session("2026-11-24T09:00:00Z", "2026-11-24T10:00:00Z")], [], clock)).toBeNull();
    expect(describeLastWorked([], [new Date("2026-11-23T08:00:00Z")], clock)).toBeNull();
    expect(describeLastWorked([], [], clock)).toBeNull();
  });

  it("doesn't count sessions that haven't happened yet", () => {
    const sessions = [
      session("2026-11-19T09:00:00Z", "2026-11-19T10:00:00Z"),
      session("2026-11-28T09:00:00Z", "2026-11-28T10:00:00Z"), // planned for Saturday
    ];

    expect(describeLastWorked(sessions, [], clock)).toBe("Last worked on 7 days ago");
  });

  it("says yesterday rather than 1 day ago", () => {
    const monday = { now: new Date("2026-11-30T10:00:00Z"), weekStart: new Date("2026-11-30T00:00:00Z") };

    expect(describeLastWorked([], [new Date("2026-11-29T20:00:00Z")], monday)).toBe("Last worked on yesterday");
  });
});
