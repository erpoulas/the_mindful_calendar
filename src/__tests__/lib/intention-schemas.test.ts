import { describe, expect, it } from "vitest";
import { CreateIntentionSchema } from "@/lib/intention-schemas";

describe("CreateIntentionSchema", () => {
  it("accepts a name with no color", () => {
    expect(CreateIntentionSchema.safeParse({ name: "Health" }).success).toBe(true);
  });

  it("accepts a color from the palette", () => {
    const result = CreateIntentionSchema.safeParse({ name: "Health", color: "sage" });
    expect(result.success && result.data.color).toBe("sage");
  });

  it("rejects a color Google Calendar can't show, such as a free hex value", () => {
    expect(CreateIntentionSchema.safeParse({ name: "Health", color: "#4a6a99" }).success).toBe(
      false,
    );
  });

  it("requires a name", () => {
    expect(CreateIntentionSchema.safeParse({ name: "  " }).success).toBe(false);
  });
});
