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
      addPlaceholder="New item"
      toggleAction={vi.fn(async () => {})}
      addAction={vi.fn(async () => {})}
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

  it("adds an item from the blank line at the bottom and empties it for the next", async () => {
    const save = slowSave();
    renderChecklist({ addAction: save.action });
    const box = screen.getByRole("textbox", { name: "New item" }) as HTMLInputElement;

    fireEvent.change(box, { target: { value: "Walk the dog" } });
    // Pressing Enter in the box submits its form.
    fireEvent.submit(box.form!);

    expect(await screen.findByText("Walk the dog")).toBeInTheDocument();
    expect(box.value).toBe("");
    expect(save.action).toHaveBeenCalledWith("list-1", expect.any(FormData));
    save.finish();
  });

  it("adds nothing when Enter is pressed on an empty line", async () => {
    const addAction = vi.fn(async () => {});
    renderChecklist({ addAction });

    fireEvent.submit(screen.getByRole("textbox", { name: "New item" }).closest("form")!);

    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(3));
    expect(addAction).not.toHaveBeenCalled();
  });

  it("has no separate Add button", () => {
    renderChecklist();

    expect(screen.queryByRole("button", { name: "Add" })).not.toBeInTheDocument();
  });

  it("shows just the blank line on an empty list", () => {
    renderChecklist({ items: [] });

    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("textbox", { name: "New item" })).toBeInTheDocument();
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

    fireEvent.click(screen.getAllByRole("button", { name: "Move to post-its" })[0]);

    await waitFor(() => expect(screen.queryByText("Buy milk")).not.toBeInTheDocument());
    expect(save.action).toHaveBeenCalledWith("a");
    save.finish();
  });

  it("offers Schedule as a link that opens New event filled in with the item", () => {
    renderChecklist({ scheduleProjectId: "project-9" });

    const links = screen.getAllByRole("link", { name: "Schedule" });
    expect(links[0]).toHaveAttribute(
      "href",
      "/dashboard/event?view=new&title=Buy+milk&projectId=project-9",
    );
  });

  it("turns an item's text into a box on click and shows the edit at once", async () => {
    const save = slowSave();
    renderChecklist({ editTextAction: save.action });

    fireEvent.click(screen.getByRole("button", { name: "Buy milk" }));
    const box = screen.getByRole("textbox", { name: "Item text" });
    fireEvent.change(box, { target: { value: "Buy oat milk" } });
    fireEvent.keyDown(box, { key: "Enter" });

    expect(await screen.findByText("Buy oat milk")).toBeInTheDocument();
    expect(save.action).toHaveBeenCalledWith("a", expect.any(FormData));
    save.finish();
  });

  it("throws the edit away on Escape, without saving", async () => {
    const save = slowSave();
    renderChecklist({ editTextAction: save.action });

    fireEvent.click(screen.getByRole("button", { name: "Buy milk" }));
    const box = screen.getByRole("textbox", { name: "Item text" });
    fireEvent.change(box, { target: { value: "Something else" } });
    fireEvent.keyDown(box, { key: "Escape" });

    expect(await screen.findByRole("button", { name: "Buy milk" })).toBeInTheDocument();
    expect(save.action).not.toHaveBeenCalled();
  });

  it("starts an item now with one click and confirms with a check", async () => {
    const startNow = vi.fn<(itemId: string) => Promise<void>>(async () => {});
    renderChecklist({ startNowAction: startNow });

    fireEvent.click(screen.getAllByRole("button", { name: "Start now (adds a 1-hour event)" })[0]);

    expect(await screen.findByRole("status", { name: "Added to your calendar" })).toBeInTheDocument();
    expect(startNow).toHaveBeenCalledWith("a");
  });

  it("has no Start now button unless asked for", () => {
    renderChecklist();

    expect(screen.queryByRole("button", { name: /Start now/ })).not.toBeInTheDocument();
  });

  it("deletes an item when its text is cleared away", async () => {
    const save = slowSave();
    renderChecklist({ editTextAction: vi.fn(async () => {}), deleteAction: save.action });

    fireEvent.click(screen.getByRole("button", { name: "Buy milk" }));
    const box = screen.getByRole("textbox", { name: "Item text" });
    fireEvent.change(box, { target: { value: "" } });
    fireEvent.keyDown(box, { key: "Enter" });

    await waitFor(() => expect(screen.queryByText("Buy milk")).not.toBeInTheDocument());
    expect(save.action).toHaveBeenCalledWith("a");
    save.finish();
  });

  it("deletes an item on one more Backspace once its box is empty", async () => {
    const save = slowSave();
    renderChecklist({ editTextAction: vi.fn(async () => {}), deleteAction: save.action });

    fireEvent.click(screen.getByRole("button", { name: "Buy milk" }));
    const box = screen.getByRole("textbox", { name: "Item text" });
    fireEvent.change(box, { target: { value: "" } });
    fireEvent.keyDown(box, { key: "Backspace" });

    await waitFor(() => expect(screen.queryByText("Buy milk")).not.toBeInTheDocument());
    expect(save.action).toHaveBeenCalledWith("a");
    save.finish();
  });

  it("keeps an item whose text is cleared when the list can't delete items", async () => {
    renderChecklist({ editTextAction: vi.fn(async () => {}) });

    fireEvent.click(screen.getByRole("button", { name: "Buy milk" }));
    const box = screen.getByRole("textbox", { name: "Item text" });
    fireEvent.change(box, { target: { value: "" } });
    fireEvent.keyDown(box, { key: "Enter" });

    expect(await screen.findByRole("button", { name: "Buy milk" })).toBeInTheDocument();
  });
});
