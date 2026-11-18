import { describe, expect, it } from "vitest";
import { LoginSchema, SignupSchema, passwordRequirements } from "@/lib/auth-schemas";

describe("passwordRequirements", () => {
  const metLabels = (password: string) =>
    passwordRequirements.filter((r) => r.isMet(password)).map((r) => r.label);

  it("lists length, letter and number rules", () => {
    expect(passwordRequirements.map((r) => r.label)).toEqual([
      "At least 8 characters",
      "A letter",
      "A number",
    ]);
  });

  it("reports nothing met for an empty password", () => {
    expect(metLabels("")).toEqual([]);
  });

  it("reports each rule independently", () => {
    expect(metLabels("abc")).toEqual(["A letter"]);
    expect(metLabels("12345678")).toEqual(["At least 8 characters", "A number"]);
    expect(metLabels("abc12345")).toEqual(["At least 8 characters", "A letter", "A number"]);
  });

  it("uses the same rules as the signup schema's error messages", () => {
    const result = SignupSchema.safeParse({
      email: "person@example.com",
      password: "abcdefgh",
      confirmPassword: "abcdefgh",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(["Password needs a number"]);
  });
});

describe("SignupSchema", () => {
  it("accepts a valid email, matching passwords", () => {
    const result = SignupSchema.safeParse({
      email: "person@example.com",
      password: "abc12345",
      confirmPassword: "abc12345",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = SignupSchema.safeParse({
      email: "not-an-email",
      password: "abc12345",
      confirmPassword: "abc12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password under 8 characters", () => {
    const result = SignupSchema.safeParse({
      email: "person@example.com",
      password: "abc123",
      confirmPassword: "abc123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password with no number", () => {
    const result = SignupSchema.safeParse({
      email: "person@example.com",
      password: "abcdefgh",
      confirmPassword: "abcdefgh",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password with no letter", () => {
    const result = SignupSchema.safeParse({
      email: "person@example.com",
      password: "12345678",
      confirmPassword: "12345678",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched confirmPassword", () => {
    const result = SignupSchema.safeParse({
      email: "person@example.com",
      password: "abc12345",
      confirmPassword: "abc99999",
    });
    expect(result.success).toBe(false);
  });
});

describe("LoginSchema", () => {
  it("accepts a valid email and non-empty password", () => {
    const result = LoginSchema.safeParse({
      email: "person@example.com",
      password: "whatever-they-set",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = LoginSchema.safeParse({
      email: "not-an-email",
      password: "whatever-they-set",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = LoginSchema.safeParse({
      email: "person@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});
