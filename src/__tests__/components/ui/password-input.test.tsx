import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordInput } from "@/components/ui/password-input";

describe("PasswordInput", () => {
  it("starts hidden and toggles between shown and hidden", async () => {
    const user = userEvent.setup();
    render(<PasswordInput id="password" name="password" aria-label="Password" />);
    const input = screen.getByLabelText("Password");

    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input).toHaveAttribute("type", "password");
  });

  it("does not submit the form when the toggle is clicked", async () => {
    const user = userEvent.setup();
    let submitted = false;
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted = true;
        }}
      >
        <PasswordInput aria-label="Password" />
      </form>,
    );

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(submitted).toBe(false);
  });
});
