import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Checklist } from "@/app/dashboard/overlays/checklist";

/** A save that stays in progress until the test finishes it. */
function slowSave() {
  let finish!: () => void;
  let fail!: (error: Error) => void;
  const done = new Promise<void>((resolve, reject) => {
    finish = resolve;
    fail = reject;
  });
  return { action: vi.fn(() => done), finish, fail };
}

const items = [
  { id: "a", text: "Buy milk", done: false },
  { id: "b", text: "Call mom", done: true },
];

function renderChecklist(overrides: Partial<Parameters<typeof Checklist>[0]> = {}) {
  return render(
    <Checklist
      listId="list-1"
      items={items}
      emptyText="No items yet."
      addPlaceholder="Add an item"
      toggleAction={vi.fn(async () => {})}
      addAction={vi.fn(async () => {})}
      listClassName=""
      formClassName=""
      {...overrides}
    />,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Checklist", () => {
  it("ticks an item the moment it's clicked, before the save finishes", async () => {
    const save = slowSave();
    renderChecklist({ toggleAction: save.action });

    fireEvent.click(screen.getAllByRole("button", { name: "Mark done" })[0]);

    expect(await screen.findAllByRole("button", { name: "Mark not done" })).toHaveLength(2);
    expect(save.action).toHaveBeenCalledWith("a", "list-1");
    save.finish();
  });

  it("shows a new item at once and empties the box", async () => {
    const save = slowSave();
    renderChecklist({ addAction: save.action });
    const box = screen.getByPlaceholderText("Add an item") as HTMLInputElement;

    fireEvent.change(box, { target: { value: "Walk the dog" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText("Walk the dog")).toBeInTheDocument();
    expect(box.value).toBe("");
    expect(save.action).toHaveBeenCalledWith("list-1", expect.any(FormData));
    save.finish();
  });

  it("undoes the tick when the save fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const save = slowSave();
    renderChecklist({ toggleAction: save.action });

    fireEvent.click(screen.getAllByRole("button", { name: "Mark done" })[0]);
    expect(await screen.findAllByRole("button", { name: "Mark not done" })).toHaveLength(2);

    save.fail(new Error("offline"));

    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Mark done" })).toHaveLength(1),
    );
  });

  it("takes an item off the list at once when it's turned into a post-it", async () => {
    const save = slowSave();
    renderChecklist({ promoteToPostItAction: save.action });

    fireEvent.click(screen.getAllByRole("button", { name: "→ Post-it" })[0]);

    await waitFor(() => expect(screen.queryByText("Buy milk")).not.toBeInTheDocument());
    expect(save.action).toHaveBeenCalledWith("a");
    save.finish();
  });
});
