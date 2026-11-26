import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NewNameButton } from "@/app/dashboard/overlays/new-name-button";

function renderButton(
  createAction = vi.fn<(formData: FormData) => Promise<void>>(async () => {}),
  noun = "list",
) {
  render(
    <NewNameButton noun={noun} createAction={createAction}>
      +
    </NewNameButton>,
  );
  return createAction;
}

function openNameBox() {
  fireEvent.click(screen.getByRole("button", { name: "New list" }));
  return screen.getByRole("textbox", { name: "New list name" }) as HTMLInputElement;
}

describe("NewNameButton", () => {
  it("turns into a name box in place when clicked", () => {
    renderButton();

    expect(openNameBox()).toHaveFocus();
  });

  it("creates the thing from the typed name when the box is submitted", async () => {
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

  it("names its button and box after what it makes", () => {
    renderButton(undefined, "journal");

    fireEvent.click(screen.getByRole("button", { name: "New journal" }));

    expect(screen.getByRole("textbox", { name: "New journal name" })).toHaveAttribute(
      "placeholder",
      "Journal name",
    );
  });
});
