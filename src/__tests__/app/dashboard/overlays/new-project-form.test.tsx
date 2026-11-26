import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NewProjectForm } from "@/app/dashboard/overlays/new-project-form";

const intentions = [{ id: "health", name: "Health", colorHex: null }];

describe("NewProjectForm", () => {
  it("only lets you start the project once it has a name, an end goal and an intention", () => {
    render(<NewProjectForm intentions={intentions} createAction={vi.fn(async () => undefined)} />);
    const start = screen.getByRole("button", { name: "Start project" });

    fireEvent.change(screen.getByRole("textbox", { name: "Project name" }), { target: { value: "Garden" } });
    fireEvent.change(screen.getByRole("textbox", { name: "End goal" }), { target: { value: "Grow tomatoes" } });
    expect(start).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Health" }));
    expect(start).toBeEnabled();
  });

  it("points to Intentions when there are none to pick yet", () => {
    render(<NewProjectForm intentions={[]} createAction={vi.fn(async () => undefined)} />);

    expect(screen.getByRole("link", { name: "Add an intention" })).toHaveAttribute(
      "href",
      "/dashboard/intentions",
    );
  });
});
