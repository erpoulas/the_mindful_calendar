import { describe, expect, it } from "vitest";
import { buildHourLabelColumns, formatClockTime } from "@/lib/hour-labels";

// Wall-clock helper: the UTC fields hold the time as it reads on the clock.
const at = (hour: number, minute = 0) => new Date(Date.UTC(2026, 10, 15, hour, minute));

describe("formatClockTime", () => {
  it("uses am/pm on the 12-hour clock, dropping :00", () => {
    expect(formatClockTime(at(0), false)).toBe("12 AM");
    expect(formatClockTime(at(9), false)).toBe("9 AM");
    expect(formatClockTime(at(12), false)).toBe("12 PM");
    expect(formatClockTime(at(13), false)).toBe("1 PM");
  });

  it("keeps the minutes on the 12-hour clock when they aren't zero", () => {
    expect(formatClockTime(at(14, 30), false)).toBe("2:30 PM");
  });

  it("uses zero-padded hours on the 24-hour (military) clock", () => {
    expect(formatClockTime(at(0), true)).toBe("00:00");
    expect(formatClockTime(at(9), true)).toBe("09:00");
    expect(formatClockTime(at(13), true)).toBe("13:00");
    expect(formatClockTime(at(14, 30), true)).toBe("14:30");
  });
});

describe("buildHourLabelColumns", () => {
  const day = new Date(Date.UTC(2026, 10, 15)); // Sun 15 Nov 2026, no DST change

  it("returns just the main zone, without a heading, when there are no extra zones", () => {
    const columns = buildHourLabelColumns({
      day,
      timeZone: "America/Denver",
      extraTimeZones: [],
      use24HourClock: false,
    });

    expect(columns).toHaveLength(1);
    expect(columns[0].heading).toBeNull();
    expect(columns[0].labels).toHaveLength(24);
    expect(columns[0].labels[9]).toBe("9 AM");
  });

  it("puts extra zones first and the main zone last, nearest the grid, each with a GMT heading", () => {
    const columns = buildHourLabelColumns({
      day,
      timeZone: "America/Denver", // GMT-7 in November
      extraTimeZones: ["America/Chicago"], // GMT-6
      use24HourClock: false,
    });

    expect(columns.map((column) => column.heading)).toEqual(["GMT-6", "GMT-7"]);
    // 9 AM in Denver is 10 AM in Chicago, as in Google Calendar.
    expect(columns[0].labels[9]).toBe("10 AM");
    expect(columns[1].labels[9]).toBe("9 AM");
  });

  it("handles half-hour zones and the 24-hour clock", () => {
    const columns = buildHourLabelColumns({
      day,
      timeZone: "UTC",
      extraTimeZones: ["Asia/Kolkata"], // GMT+5:30
      use24HourClock: true,
    });

    expect(columns[0].heading).toBe("GMT+5:30");
    expect(columns[0].labels[9]).toBe("14:30");
    expect(columns[1].heading).toBe("GMT");
    expect(columns[1].labels[9]).toBe("09:00");
  });
});
