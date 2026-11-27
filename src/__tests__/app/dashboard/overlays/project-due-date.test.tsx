import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ProjectDueDate } from "@/app/dashboard/overlays/project-due-date";

describe("ProjectDueDate", () => {
  it("saves a day picked in the date box and counts down to it straight away", async () => {
    // A save still on its way: the countdown must show before the server answers.
    const saveAction = vi.fn((_value: string) => new Promise<void>(() => {}));
    render(<ProjectDueDate dueDate="" today="2026-11-26" saveAction={saveAction} />);

    fireEvent.click(screen.getByRole("button", { name: "Add a due date" }));
    const box = screen.getByLabelText("Due date");
    fireEvent.change(box, { target: { value: "2026-12-05" } });
    fireEvent.blur(box);

    const countdown = await screen.findByRole("button", { name: "9 days to go" });
    expect(countdown).toHaveAttribute("title", "Due Sat, Dec 5, 2026");
    expect(saveAction).toHaveBeenCalledWith("2026-12-05");
  });

  it("clears the due date with the ✕", async () => {
    const saveAction = vi.fn(async () => {});
    render(<ProjectDueDate dueDate="2026-12-05" today="2026-11-26" saveAction={saveAction} />);

    fireEvent.click(screen.getByRole("button", { name: "Clear due date" }));

    expect(await screen.findByRole("button", { name: "Add a due date" })).toBeInTheDocument();
    expect(saveAction).toHaveBeenCalledWith("");
  });
});
