import { describe, expect, it } from "vitest";
import {
  eventColor,
  findIntentionColor,
  INTENTION_COLORS,
} from "@/lib/intention-colors";

describe("INTENTION_COLORS", () => {
  it("offers exactly Google Calendar's 11 event colors, each with its own Google color id", () => {
    expect(INTENTION_COLORS).toHaveLength(11);
    const googleIds = INTENTION_COLORS.map((color) => color.googleColorId).sort(
      (a, b) => Number(a) - Number(b),
    );
    expect(googleIds).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"]);
  });

  it("gives every color a unique key", () => {
    const keys = new Set(INTENTION_COLORS.map((color) => color.key));
    expect(keys.size).toBe(INTENTION_COLORS.length);
  });
});

describe("findIntentionColor", () => {
  it("finds a palette color by its key", () => {
    expect(findIntentionColor("sage")).toMatchObject({ key: "sage", googleColorId: "2" });
  });

  it("returns null when no color is stored", () => {
    expect(findIntentionColor(null)).toBeNull();
    expect(findIntentionColor("")).toBeNull();
  });

  it("reads a hex color saved before the palette existed as the nearest palette color", () => {
    // The old default blue sits closest to Blueberry.
    expect(findIntentionColor("#4a6a99")?.key).toBe("blueberry");
    expect(findIntentionColor("#ff0000")?.key).toBe("tomato");
    expect(findIntentionColor("#33B679")?.key).toBe("sage");
  });

  it("returns null for text that is neither a key nor a hex color", () => {
    expect(findIntentionColor("purple-ish")).toBeNull();
  });
});

describe("eventColor", () => {
  const link = (color: string | null, createdAt: string) => ({
    intention: { color, createdAt: new Date(createdAt) },
  });

  it("returns null for an event with no intentions", () => {
    expect(eventColor([])).toBeNull();
  });

  it("returns null when none of the event's intentions has a color", () => {
    expect(eventColor([link(null, "2026-01-01")])).toBeNull();
  });

  it("uses the color of the oldest intention that has one", () => {
    const color = eventColor([
      link("tomato", "2026-03-01"),
      link(null, "2026-01-01"),
      link("sage", "2026-02-01"),
    ]);
    expect(color?.key).toBe("sage");
  });
});
