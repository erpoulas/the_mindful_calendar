import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RemovableList } from "@/app/dashboard/overlays/removable-list";

const never = () => new Promise<void>(() => {});

function renderList(removeAction = vi.fn(never), addAction = vi.fn(never)) {
  render(
    <RemovableList
      items={[
        { id: "a", text: "Take a walk" },
        { id: "b", text: "Call a friend" },
      ]}
      emptyText="Nothing here yet."
      addPlaceholder="e.g. Take a 10 minute walk"
      addLabel="Add"
      removeAction={removeAction}
      addAction={addAction}
      listClassName=""
    />,
  );
  return { removeAction, addAction };
}

describe("RemovableList", () => {
  it("removes a line the moment Remove is clicked", async () => {
    const { removeAction } = renderList();

    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);

    await waitFor(() => expect(screen.queryByText("Take a walk")).not.toBeInTheDocument());
    expect(removeAction).toHaveBeenCalledWith("a");
  });

  it("adds a line at once, with Remove disabled until it's saved", async () => {
    const { addAction } = renderList();

    fireEvent.change(screen.getByPlaceholderText("e.g. Take a 10 minute walk"), {
      target: { value: "Dance" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText("Dance")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Remove" })[2]).toBeDisabled();
    expect(addAction).toHaveBeenCalledWith(expect.any(FormData));
  });
});
