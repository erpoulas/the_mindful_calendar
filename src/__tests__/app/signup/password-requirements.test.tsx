import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PasswordRequirements } from "@/app/signup/password-requirements";

const itemFor = (label: string) => screen.getByText(label).closest("li");

describe("PasswordRequirements", () => {
  it("shows every rule unmet for an empty password", () => {
    render(<PasswordRequirements password="" />);

    expect(itemFor("At least 8 characters")).toHaveAttribute("data-met", "false");
    expect(itemFor("A letter")).toHaveAttribute("data-met", "false");
    expect(itemFor("A number")).toHaveAttribute("data-met", "false");
  });

  it("checks off only the rules the password meets", () => {
    render(<PasswordRequirements password="abc1" />);

    expect(itemFor("At least 8 characters")).toHaveAttribute("data-met", "false");
    expect(itemFor("A letter")).toHaveAttribute("data-met", "true");
    expect(itemFor("A number")).toHaveAttribute("data-met", "true");
  });

  it("tells screen readers which rules are met", () => {
    render(<PasswordRequirements password="abcdefgh" />);

    expect(itemFor("At least 8 characters")).toHaveTextContent("Met: At least 8 characters");
    expect(itemFor("A number")).toHaveTextContent("Not met yet: A number");
  });
});
