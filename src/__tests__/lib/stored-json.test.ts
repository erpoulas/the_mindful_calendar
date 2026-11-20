import { describe, expect, it } from "vitest";
import { fromStoredJson, toStoredJson } from "@/lib/stored-json";

describe("toStoredJson / fromStoredJson", () => {
  it("brings dates back as real Date objects, even nested ones", () => {
    const value = {
      title: "Run",
      startAt: new Date("2026-11-20T09:00:00Z"),
      intentions: [{ createdAt: new Date("2026-01-02T03:04:05Z") }],
    };

    const restored = fromStoredJson<typeof value>(toStoredJson(value));

    expect(restored).toEqual(value);
    expect(restored.startAt).toBeInstanceOf(Date);
    expect(restored.intentions[0].createdAt).toBeInstanceOf(Date);
  });

  it("keeps nulls, numbers, strings and arrays as they were", () => {
    const value = { endAt: null, count: 3, names: ["a", "b"], done: false };

    expect(fromStoredJson(toStoredJson(value))).toEqual(value);
  });

  it("stores a missing result (null) as null", () => {
    expect(fromStoredJson(toStoredJson(null))).toBeNull();
  });

  it("leaves an ordinary object that has a $date key plus others alone", () => {
    const value = { $date: "not a date", other: 1 };

    expect(fromStoredJson(toStoredJson(value))).toEqual(value);
  });
});
