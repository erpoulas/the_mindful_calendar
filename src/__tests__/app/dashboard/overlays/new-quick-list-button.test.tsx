import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NewQuickListButton } from "@/app/dashboard/overlays/new-quick-list-button";

function renderButton(createAction = vi.fn<(formData: FormData) => Promise<void>>(async () => {})) {
  render(<NewQuickListButton createAction={createAction}>+</NewQuickListButton>);
  return createAction;
}

function openNameBox() {
  fireEvent.click(screen.getByRole("button", { name: "New list" }));
  return screen.getByRole("textbox", { name: "New list name" }) as HTMLInputElement;
}

describe("NewQuickListButton", () => {
  it("turns into a name box in place when clicked", () => {
    renderButton();

    expect(openNameBox()).toHaveFocus();
  });

  it("creates the list from the typed name when the box is submitted", async () => {
    const createAction = renderButton();
    const box = openNameBox();

    fireEvent.change(box, { target: { value: "Packing" } });
    fireEvent.submit(box.form!);

    await waitFor(() => expect(createAction).toHaveBeenCalledTimes(1));
    expect(createAction.mock.calls[0][0].get("name")).toBe("Packing");
  });

  it("goes back to the button on Escape, or when left empty", () => {
    const createAction = renderButton();

    fireEvent.keyDown(openNameBox(), { key: "Escape" });
    expect(screen.getByRole("button", { name: "New list" })).toBeInTheDocument();

    fireEvent.blur(openNameBox());
    expect(screen.getByRole("button", { name: "New list" })).toBeInTheDocument();
    expect(createAction).not.toHaveBeenCalled();
  });
});
