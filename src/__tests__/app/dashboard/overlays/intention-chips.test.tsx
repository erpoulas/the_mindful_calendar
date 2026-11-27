import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ProjectIntentionChips } from "@/app/dashboard/overlays/intention-chips";

const intentions = [
  { id: "health", name: "Health", colorHex: "#33b679" },
  { id: "family", name: "Family", colorHex: null },
];

describe("ProjectIntentionChips", () => {
  it("shows only the picked intentions until you choose to change them", () => {
    render(<ProjectIntentionChips intentions={intentions} selectedIds={["health"]} saveAction={vi.fn()} />);

    expect(screen.getByText("Health")).toBeInTheDocument();
    expect(screen.queryByText("Family")).not.toBeInTheDocument();
  });

  it("picks an intention on click, showing it at once and saving the new set", async () => {
    const saveAction = vi.fn(async () => {});
    render(<ProjectIntentionChips intentions={intentions} selectedIds={["health"]} saveAction={saveAction} />);

    fireEvent.click(screen.getByRole("button", { name: "Change intentions" }));
    fireEvent.click(screen.getByRole("button", { name: "Family" }));

    expect(await screen.findByRole("button", { name: "Family", pressed: true })).toBeInTheDocument();
    expect(saveAction).toHaveBeenCalledWith(["health", "family"]);
  });

  it("won't unpick the last intention, since a project must serve one", () => {
    const saveAction = vi.fn(async () => {});
    render(<ProjectIntentionChips intentions={intentions} selectedIds={["health"]} saveAction={saveAction} />);

    fireEvent.click(screen.getByRole("button", { name: "Change intentions" }));
    fireEvent.click(screen.getByRole("button", { name: "Health" }));

    expect(screen.getByRole("button", { name: "Health", pressed: true })).toBeInTheDocument();
    expect(saveAction).not.toHaveBeenCalled();
  });
});
