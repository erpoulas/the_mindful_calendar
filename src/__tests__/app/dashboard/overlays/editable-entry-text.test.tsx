import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { EditableEntryText } from "@/app/dashboard/overlays/editable-entry-text";

function renderEntry(text: string | null = "Slept well.\nWalked by the river.") {
  const saveAction = vi.fn<(entryId: string, formData: FormData) => Promise<void>>(async () => {});
  render(<EditableEntryText entryId="entry-1" text={text} saveAction={saveAction} />);
  return saveAction;
}

function openBox(name: string | RegExp = /Slept well/) {
  fireEvent.click(screen.getByRole("button", { name }));
  return screen.getByRole("textbox", { name: "Entry" }) as HTMLTextAreaElement;
}

describe("EditableEntryText", () => {
  it("turns the entry into a writing box when clicked, cursor at the end", () => {
    renderEntry();

    const box = openBox();

    expect(box).toHaveFocus();
    expect(box.value).toBe("Slept well.\nWalked by the river.");
    expect(box.selectionStart).toBe(box.value.length);
  });

  it("saves when you click away and shows the new text at once", async () => {
    const saveAction = renderEntry();
    const box = openBox();

    fireEvent.change(box, { target: { value: "Slept badly." } });
    fireEvent.blur(box);

    expect(await screen.findByRole("button", { name: "Slept badly." })).toBeInTheDocument();
    expect(saveAction).toHaveBeenCalledTimes(1);
    const [entryId, formData] = saveAction.mock.calls[0];
    expect(entryId).toBe("entry-1");
    expect(formData.get("content")).toBe("Slept badly.");
  });

  it("keeps Enter for new lines", () => {
    const saveAction = renderEntry();
    const box = openBox();

    fireEvent.keyDown(box, { key: "Enter" });

    expect(screen.getByRole("textbox", { name: "Entry" })).toBeInTheDocument();
    expect(saveAction).not.toHaveBeenCalled();
  });

  it("throws the edit away on Escape", () => {
    const saveAction = renderEntry();
    const box = openBox();

    fireEvent.change(box, { target: { value: "Something else" } });
    fireEvent.keyDown(box, { key: "Escape" });

    expect(screen.getByRole("button", { name: /Slept well/ })).toBeInTheDocument();
    expect(saveAction).not.toHaveBeenCalled();
  });

  it("doesn't save when nothing changed", () => {
    const saveAction = renderEntry();

    fireEvent.blur(openBox());

    expect(saveAction).not.toHaveBeenCalled();
  });

  it("edits the prompt as one line: Enter saves, and it can be cleared away", async () => {
    const saveAction = vi.fn<(entryId: string, formData: FormData) => Promise<void>>(async () => {});
    render(
      <EditableEntryText entryId="entry-1" field="promptText" text="What went well?" saveAction={saveAction} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "What went well?" }));
    const box = screen.getByRole("textbox", { name: "Prompt" });
    fireEvent.change(box, { target: { value: "" } });
    fireEvent.keyDown(box, { key: "Enter" });

    expect(await screen.findByRole("button", { name: "Add a prompt" })).toBeInTheDocument();
    expect(saveAction.mock.calls[0][1].get("promptText")).toBe("");
  });

  it("invites you to write an entry that's still blank", () => {
    renderEntry(null);

    const box = openBox(/Not written yet/);

    expect(box.value).toBe("");
  });
});
