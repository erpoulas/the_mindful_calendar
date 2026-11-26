import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { JournalScheduleControl } from "@/app/dashboard/overlays/journal-schedule-control";

const EVENING = { weekdays: [1, 3, 5], startMinutes: 21 * 60, durationMinutes: 20 };

function renderControl(schedule: typeof EVENING | null = null) {
  const saveAction = vi.fn<(formData: FormData) => Promise<void>>(async () => {});
  render(<JournalScheduleControl schedule={schedule} saveAction={saveAction} />);
  return saveAction;
}

const lastSaved = (saveAction: ReturnType<typeof renderControl>) => saveAction.mock.lastCall![0];

describe("JournalScheduleControl", () => {
  it("sums up the journal time, or invites you to set one", () => {
    renderControl(EVENING);
    expect(screen.getByRole("button", { name: /Mon, Wed, Fri at 9:00 PM · 20 min/ })).toBeInTheDocument();
  });

  it("invites you to set a journal time when there is none", () => {
    renderControl();
    expect(screen.getByRole("button", { name: /Set a journal time/ })).toBeInTheDocument();
  });

  it("saves each day you tick right away, with the time and length", async () => {
    const saveAction = renderControl();

    fireEvent.click(screen.getByRole("button", { name: /Set a journal time/ }));
    fireEvent.click(screen.getByRole("button", { name: "Tuesday" }));

    await waitFor(() => expect(saveAction).toHaveBeenCalledTimes(1));
    expect(lastSaved(saveAction).getAll("weekdays")).toEqual(["2"]);
    expect(lastSaved(saveAction).get("startMinutes")).toBe(String(21 * 60));
    expect(lastSaved(saveAction).get("durationMinutes")).toBe("15");
    expect(screen.getByRole("button", { name: "Tuesday" })).toHaveAttribute("aria-pressed", "true");
  });

  it("saves a new time and length", async () => {
    const saveAction = renderControl(EVENING);

    fireEvent.click(screen.getByRole("button", { name: /Mon, Wed, Fri/ }));
    fireEvent.change(screen.getByLabelText("Time"), { target: { value: "07:30" } });
    await waitFor(() => expect(lastSaved(saveAction).get("startMinutes")).toBe(String(7 * 60 + 30)));

    fireEvent.change(screen.getByLabelText("Length"), { target: { value: "45" } });
    await waitFor(() => expect(lastSaved(saveAction).get("durationMinutes")).toBe("45"));
    expect(lastSaved(saveAction).getAll("weekdays")).toEqual(["1", "3", "5"]);
  });

  it("turns the journal time off", async () => {
    const saveAction = renderControl(EVENING);

    fireEvent.click(screen.getByRole("button", { name: /Mon, Wed, Fri/ }));
    fireEvent.click(screen.getByRole("button", { name: "Turn off" }));

    await waitFor(() => expect(saveAction).toHaveBeenCalled());
    expect(lastSaved(saveAction).getAll("weekdays")).toEqual([]);
    expect(screen.getByRole("button", { name: /Set a journal time/ })).toBeInTheDocument();
  });
});
