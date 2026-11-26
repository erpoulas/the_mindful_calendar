import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QuickListName } from "@/app/dashboard/overlays/quick-list-name";

function renderName(renameAction = vi.fn(async () => {})) {
  render(<QuickListName listId="list-1" name="Groceries" renameAction={renameAction} />);
  return renameAction;
}

function openNameBox() {
  fireEvent.click(screen.getByRole("button", { name: "Groceries" }));
  return screen.getByRole("textbox", { name: "List name" }) as HTMLTextAreaElement;
}

describe("QuickListName", () => {
  it("turns the name into a text box when clicked, holding the current name", () => {
    renderName();

    expect(openNameBox().value).toBe("Groceries");
  });

  it("saves the new name on Enter and shows it straight away", async () => {
    const renameAction = renderName();
    const box = openNameBox();

    fireEvent.change(box, { target: { value: "Weekly shop" } });
    fireEvent.keyDown(box, { key: "Enter" });

    expect(await screen.findByRole("button", { name: "Weekly shop" })).toBeInTheDocument();
    expect(renameAction).toHaveBeenCalledTimes(1);
    const [listId, formData] = renameAction.mock.calls[0] as unknown as [string, FormData];
    expect(listId).toBe("list-1");
    expect(formData.get("name")).toBe("Weekly shop");
  });

  it("saves when you click away from the box", async () => {
    const renameAction = renderName();
    const box = openNameBox();

    fireEvent.change(box, { target: { value: "Weekly shop" } });
    fireEvent.blur(box);

    expect(await screen.findByRole("button", { name: "Weekly shop" })).toBeInTheDocument();
    expect(renameAction).toHaveBeenCalledTimes(1);
  });

  it("throws the edit away on Escape", () => {
    const renameAction = renderName();
    const box = openNameBox();

    fireEvent.change(box, { target: { value: "Weekly shop" } });
    fireEvent.keyDown(box, { key: "Escape" });

    expect(screen.getByRole("button", { name: "Groceries" })).toBeInTheDocument();
    expect(renameAction).not.toHaveBeenCalled();
  });

  it("keeps the old name when the box is left empty or unchanged", () => {
    const renameAction = renderName();

    fireEvent.change(openNameBox(), { target: { value: "   " } });
    fireEvent.keyDown(screen.getByRole("textbox", { name: "List name" }), { key: "Enter" });
    fireEvent.keyDown(openNameBox(), { key: "Enter" });

    expect(screen.getByRole("button", { name: "Groceries" })).toBeInTheDocument();
    expect(renameAction).not.toHaveBeenCalled();
  });
});
