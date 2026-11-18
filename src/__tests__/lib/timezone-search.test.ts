import { describe, expect, it } from "vitest";
import { searchTimezones } from "@/lib/timezone-search";

describe("searchTimezones", () => {
  it("finds a smaller city and gives its time zone", () => {
    const [first] = searchTimezones("boulder");

    expect(first).toEqual({
      label: "Boulder, Colorado, US",
      timezone: "America/Denver",
      zoneName: "Mountain Time",
    });
  });

  it("matches the start of the city name, ignoring case and accents", () => {
    const labels = searchTimezones("SÃO PAU").map((match) => match.label);

    expect(labels).toContain("Sao Paulo, São Paulo, BR");
  });

  it("lists bigger cities first", () => {
    const labels = searchTimezones("springfield").map((match) => match.label);

    expect(labels.slice(0, 2)).toEqual([
      "Springfield, Massachusetts, US",
      "Springfield, Missouri, US",
    ]);
  });

  it("finds time zones by their name, like Mountain or Pacific", () => {
    expect(searchTimezones("mountain").map((match) => match.timezone)).toContain("America/Denver");
    expect(searchTimezones("pacific").map((match) => match.timezone)).toContain("America/Los_Angeles");
  });

  it("doesn't repeat a zone already shown under a city", () => {
    const denverZones = searchTimezones("denver").filter((match) => match.label === "America/Denver");

    expect(denverZones).toEqual([]);
  });

  it("returns nothing for searches under two letters", () => {
    expect(searchTimezones("b")).toEqual([]);
    expect(searchTimezones("  ")).toEqual([]);
  });

  it("returns at most the limit", () => {
    expect(searchTimezones("san", 5)).toHaveLength(5);
  });
});
