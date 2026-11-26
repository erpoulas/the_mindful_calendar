import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("@/app/actions/affirmations", () => ({
  setTodayAffirmationAction: vi.fn(async () => {}),
  clearTodayAffirmationAction: vi.fn(async () => {}),
  pickAffirmationAction: vi.fn(async () => {}),
}));

import { setTodayAffirmationAction } from "@/app/actions/affirmations";
import { AffirmationOfTheDay } from "@/app/dashboard/overlays/affirmation-of-the-day";

describe("AffirmationOfTheDay", () => {
  it("opens an editor with the current text when clicked", () => {
    render(<AffirmationOfTheDay text="I am enough" keptUntilLabel={null} hasList />);

    fireEvent.click(screen.getByRole("button", { name: "Edit today's affirmation" }));

    expect(screen.getByRole("textbox", { name: "Today's affirmation" })).toHaveProperty(
      "value",
      "I am enough",
    );
    expect(screen.getByRole("combobox", { name: "Keep it" })).toHaveProperty("value", "today");
  });

  it("saves the edited text with how long to keep it, then closes the editor", async () => {
    render(<AffirmationOfTheDay text="I am enough" keptUntilLabel={null} hasList />);
    fireEvent.click(screen.getByRole("button", { name: "Edit today's affirmation" }));

    fireEvent.change(screen.getByRole("textbox", { name: "Today's affirmation" }), {
      target: { value: "I can rest" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Keep it" }), {
      target: { value: "week" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(setTodayAffirmationAction).toHaveBeenCalled());
    const formData = vi.mocked(setTodayAffirmationAction).mock.calls[0][0];
    expect(formData.get("text")).toBe("I can rest");
    expect(formData.get("keepFor")).toBe("week");
    await waitFor(() => expect(screen.queryByRole("textbox")).toBeNull());
  });

  it("Escape closes the editor without saving", () => {
    vi.mocked(setTodayAffirmationAction).mockClear();
    render(<AffirmationOfTheDay text="I am enough" keptUntilLabel={null} hasList />);
    fireEvent.click(screen.getByRole("button", { name: "Edit today's affirmation" }));

    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });

    expect(screen.queryByRole("textbox")).toBeNull();
    expect(setTodayAffirmationAction).not.toHaveBeenCalled();
  });

  it("shows how long a kept affirmation lasts, with a way back to random picks", () => {
    render(<AffirmationOfTheDay text="I am enough" keptUntilLabel="Until Dec 3" hasList />);

    expect(screen.getByText("Until Dec 3")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back to random" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Show a different one" })).toBeNull();
  });

  it("offers a different random pick when nothing is kept", () => {
    render(<AffirmationOfTheDay text="I am enough" keptUntilLabel={null} hasList />);

    expect(screen.getByRole("button", { name: "Show a different one" })).toBeTruthy();
  });
});
