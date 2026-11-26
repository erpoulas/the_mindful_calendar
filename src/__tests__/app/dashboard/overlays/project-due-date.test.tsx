import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ProjectDueDate } from "@/app/dashboard/overlays/project-due-date";

describe("ProjectDueDate", () => {
  it("saves a day picked in the date box and shows it straight away", async () => {
    const saveAction = vi.fn(async () => {});
    render(<ProjectDueDate dueDate="" saveAction={saveAction} />);

    fireEvent.click(screen.getByRole("button", { name: "Add a due date" }));
    const box = screen.getByLabelText("Due date");
    fireEvent.change(box, { target: { value: "2026-10-12" } });
    fireEvent.blur(box);

    expect(await screen.findByRole("button", { name: "Due Mon, Oct 12, 2026" })).toBeInTheDocument();
    expect(saveAction).toHaveBeenCalledWith("2026-10-12");
  });

  it("clears the due date with the ✕", async () => {
    const saveAction = vi.fn(async () => {});
    render(<ProjectDueDate dueDate="2026-10-12" saveAction={saveAction} />);

    fireEvent.click(screen.getByRole("button", { name: "Clear due date" }));

    expect(await screen.findByRole("button", { name: "Add a due date" })).toBeInTheDocument();
    expect(saveAction).toHaveBeenCalledWith("");
  });
});
