import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RemovableList } from "@/app/dashboard/overlays/removable-list";

const never = () => new Promise<void>(() => {});

function renderList(
  removeAction = vi.fn(never),
  addAction = vi.fn(never),
  createPostItAction?: (formData: FormData) => Promise<void>,
) {
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
      createPostItAction={createPostItAction}
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

  it("has no Schedule or post-it icons unless asked for", () => {
    renderList();

    expect(screen.queryByRole("link", { name: "Schedule" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Make a post-it" })).not.toBeInTheDocument();
  });

  it("schedules a menu item through New event, filled in with its text", () => {
    renderList(vi.fn(never), vi.fn(never), vi.fn(async () => {}));

    expect(screen.getAllByRole("link", { name: "Schedule" })[0]).toHaveAttribute(
      "href",
      "/dashboard/event?view=new&title=Take+a+walk",
    );
  });

  it("makes a post-it from a menu item, keeps the item, and confirms with a check", async () => {
    const createPostIt = vi.fn<(formData: FormData) => Promise<void>>(async () => {});
    renderList(vi.fn(never), vi.fn(never), createPostIt);

    fireEvent.click(screen.getAllByRole("button", { name: "Make a post-it" })[0]);

    expect(await screen.findByRole("status", { name: "Added to post-its" })).toBeInTheDocument();
    expect(createPostIt.mock.calls[0][0].get("text")).toBe("Take a walk");
    expect(screen.getByText("Take a walk")).toBeInTheDocument();
  });

  it("shows no check when the post-it couldn't be saved", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const createPostIt = vi.fn(async () => {
      throw new Error("offline");
    });
    renderList(vi.fn(never), vi.fn(never), createPostIt);

    fireEvent.click(screen.getAllByRole("button", { name: "Make a post-it" })[0]);

    await waitFor(() => expect(createPostIt).toHaveBeenCalled());
    expect(screen.queryByRole("status", { name: "Added to post-its" })).not.toBeInTheDocument();
  });
});
