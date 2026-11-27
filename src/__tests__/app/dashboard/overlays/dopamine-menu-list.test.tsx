import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DopamineMenuList, DopaminePick, pickAnother } from "@/app/dashboard/overlays/dopamine-menu-list";

const never = () => new Promise<void>(() => {});

const intentions = [
  { id: "i1", name: "Health", colorHex: "#22c55e" },
  { id: "i2", name: "Family", colorHex: null },
];

function renderMenu() {
  const actions = {
    addAction: vi.fn<(formData: FormData) => Promise<void>>(never),
    editTextAction: vi.fn<(itemId: string, formData: FormData) => Promise<void>>(never),
    deleteAction: vi.fn(never),
    startNowAction: vi.fn<(itemId: string) => Promise<void>>(async () => {}),
    createPostItAction: vi.fn<(formData: FormData) => Promise<void>>(async () => {}),
    setIntentionAction: vi.fn(never),
  };
  render(
    <DopamineMenuList
      items={[
        { id: "a", text: "Take a walk", intentionId: "i1" },
        { id: "b", text: "Call a friend", intentionId: null },
      ]}
      intentions={intentions}
      {...actions}
    />,
  );
  return actions;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DopamineMenuList", () => {
  it("has no tick circles, since menu items are meant to be reused", () => {
    renderMenu();

    expect(screen.queryByRole("button", { name: "Mark done" })).not.toBeInTheDocument();
  });

  it("shows a tagged item's intention as its bullet", () => {
    renderMenu();

    expect(screen.getByRole("img", { name: "Counts toward Health" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /Family/ })).not.toBeInTheDocument();
  });

  it("adds an item from the blank line with Enter", async () => {
    const { addAction } = renderMenu();

    const blankLine = screen.getByRole("textbox", { name: "Something that lifts you up" });
    fireEvent.change(blankLine, { target: { value: "Dance" } });
    fireEvent.submit(blankLine.closest("form")!);

    expect(await screen.findByText("Dance")).toBeInTheDocument();
    expect(addAction.mock.calls[0][0].get("text")).toBe("Dance");
  });

  it("edits an item's text in place", async () => {
    const { editTextAction } = renderMenu();

    fireEvent.click(screen.getByRole("button", { name: "Take a walk" }));
    const box = screen.getByRole("textbox", { name: "Item text" });
    fireEvent.change(box, { target: { value: "Take a long walk" } });
    fireEvent.keyDown(box, { key: "Enter" });

    await waitFor(() => expect(editTextAction).toHaveBeenCalledWith("a", expect.any(FormData)));
    expect(editTextAction.mock.calls[0][1].get("text")).toBe("Take a long walk");
  });

  it("deletes an item whose text is cleared away", async () => {
    const { deleteAction } = renderMenu();

    fireEvent.click(screen.getByRole("button", { name: "Call a friend" }));
    const box = screen.getByRole("textbox", { name: "Item text" });
    fireEvent.change(box, { target: { value: "" } });
    fireEvent.keyDown(box, { key: "Enter" });

    await waitFor(() => expect(deleteAction).toHaveBeenCalledWith("b"));
    expect(screen.queryByText("Call a friend")).not.toBeInTheDocument();
  });

  it("schedules a tagged item with its intention already ticked", () => {
    renderMenu();

    const [tagged, untagged] = screen.getAllByRole("link", { name: "Schedule" });
    expect(tagged).toHaveAttribute("href", "/dashboard/event?view=new&title=Take+a+walk&intentionId=i1");
    expect(untagged).toHaveAttribute("href", "/dashboard/event?view=new&title=Call+a+friend");
  });

  it("starts an item now with one click", async () => {
    const { startNowAction } = renderMenu();

    fireEvent.click(screen.getAllByRole("button", { name: "Start now (adds a 1-hour event)" })[0]);

    expect(await screen.findByRole("status", { name: "Added to your calendar" })).toBeInTheDocument();
    expect(startNowAction).toHaveBeenCalledWith("a");
  });

  it("makes a post-it from an item but keeps the item", async () => {
    const { createPostItAction } = renderMenu();

    fireEvent.click(screen.getAllByRole("button", { name: "Make a post-it" })[0]);

    expect(await screen.findByRole("status", { name: "Added to post-its" })).toBeInTheDocument();
    expect(createPostItAction.mock.calls[0][0].get("text")).toBe("Take a walk");
    expect(screen.getByText("Take a walk")).toBeInTheDocument();
  });

  it("shows each item's intention in its picker and saves a new pick", () => {
    const { setIntentionAction } = renderMenu();

    expect(screen.getByRole("combobox", { name: "Intention for Take a walk" })).toHaveValue("i1");
    fireEvent.change(screen.getByRole("combobox", { name: "Intention for Call a friend" }), {
      target: { value: "i2" },
    });

    expect(setIntentionAction).toHaveBeenCalledWith("b", "i2");
  });
});

describe("pickAnother", () => {
  const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("never picks the item already shown", () => {
    for (let i = 0; i < 50; i++) expect(pickAnother(items, "b")?.id).not.toBe("b");
  });

  it("picks the only item when there's just one, and nothing from an empty list", () => {
    expect(pickAnother([{ id: "a" }], "a")?.id).toBe("a");
    expect(pickAnother([], null)).toBeNull();
  });
});

describe("DopaminePick", () => {
  const pickItems = [
    { id: "a", text: "Take a walk", intentionId: "i1" },
    { id: "b", text: "Call a friend", intentionId: null },
  ];
  const actions = {
    startNowAction: async () => {},
    createPostItAction: async () => {},
  };

  it("shows a different item each time the dice is rolled", () => {
    render(<DopaminePick items={pickItems} initialPickId="a" {...actions} />);
    expect(screen.getByText("Take a walk")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pick something else" }));
    expect(screen.getByText("Call a friend")).toBeInTheDocument();
    expect(screen.queryByText("Take a walk")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pick something else" }));
    expect(screen.getByText("Take a walk")).toBeInTheDocument();
  });

  it("can't roll with only one item, and invites adding some when there are none", () => {
    const { rerender } = render(<DopaminePick items={[pickItems[0]]} initialPickId="a" {...actions} />);
    expect(screen.getByRole("button", { name: "Pick something else" })).toBeDisabled();

    rerender(<DopaminePick items={[]} initialPickId={null} {...actions} />);
    expect(screen.getByText(/Jot a few down/)).toBeInTheDocument();
  });

  it("shows another item when the picked one is deleted", () => {
    const { rerender } = render(<DopaminePick items={pickItems} initialPickId="a" {...actions} />);
    rerender(<DopaminePick items={[pickItems[1]]} initialPickId="a" {...actions} />);
    expect(screen.getByText("Call a friend")).toBeInTheDocument();
  });
});
