import { describe, expect, it } from "vitest";
import { AddDopamineMenuItemSchema, DopamineCourseSchema } from "@/lib/dopamine-menu-schemas";

describe("DopamineCourseSchema", () => {
  it("takes a course, and turns a blank or missing one into null", () => {
    expect(DopamineCourseSchema.parse("SIDE")).toBe("SIDE");
    expect(DopamineCourseSchema.parse("")).toBeNull();
    expect(DopamineCourseSchema.parse(null)).toBeNull();
    expect(DopamineCourseSchema.parse(undefined)).toBeNull();
  });

  it("rejects anything that isn't a course", () => {
    expect(DopamineCourseSchema.safeParse("SOUP").success).toBe(false);
  });
});

describe("AddDopamineMenuItemSchema", () => {
  it("needs some text, and the course is optional", () => {
    expect(AddDopamineMenuItemSchema.parse({ text: " Dance ", course: null })).toEqual({
      text: "Dance",
      course: null,
    });
    expect(AddDopamineMenuItemSchema.safeParse({ text: "  " }).success).toBe(false);
  });
});
