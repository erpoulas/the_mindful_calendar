import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { IntentionRow } from "@/app/dashboard/overlays/intention-row";

const never = () => new Promise<void>(() => {});

function renderRow(
  intention: { id: string; name: string; color: string | null; isSystem: boolean },
  recolorAction = vi.fn(never),
  deleteAction = vi.fn(never),
) {
  render(
    <ul>
      <IntentionRow intention={intention} recolorAction={recolorAction} deleteAction={deleteAction} />
    </ul>,
  );
  return { recolorAction, deleteAction };
}

const health = { id: "i1", name: "Health", color: "sage", isSystem: false };

afterEach(() => {
  vi.restoreAllMocks();
});

describe("IntentionRow", () => {
  it("opens the swatches from the color dot and recolors at once", async () => {
    const { recolorAction } = renderRow(health);

    fireEvent.click(screen.getByRole("button", { name: "Change Health's color" }));
    fireEvent.click(screen.getByLabelText("Tomato"));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Change Health's color" })).toHaveAttribute(
        "title",
        "Tomato",
      ),
    );
    expect(recolorAction).toHaveBeenCalledWith("i1", "tomato");
    expect(screen.queryByLabelText("Tomato")).not.toBeInTheDocument();
  });

  it("links the name to the intention and offers Edit and Delete", () => {
    renderRow(health);

    expect(screen.getByRole("link", { name: "Health" })).toHaveAttribute(
      "href",
      "/dashboard/intentions?view=detail&id=i1",
    );
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/dashboard/intentions?view=edit&id=i1",
    );
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("hides the row at once when Delete is confirmed", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { deleteAction } = renderRow(health);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(screen.queryByText("Health")).not.toBeInTheDocument());
    expect(deleteAction).toHaveBeenCalledWith("i1");
  });

  it("lets the built-in Journal intention change color only", () => {
    renderRow({ id: "j1", name: "Journal", color: null, isSystem: true });

    expect(screen.getByRole("button", { name: "Change Journal's color" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });
});
