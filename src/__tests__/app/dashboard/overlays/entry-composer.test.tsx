import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EntryComposer } from "@/app/dashboard/overlays/entry-composer";

const prompts = [
  { id: "p1", text: "What went well today?" },
  { id: "p2", text: "What made you smile?" },
];

function renderComposer(suggestedPrompt?: string) {
  const createAction = vi.fn<(formData: FormData) => Promise<void>>(async () => {});
  render(<EntryComposer prompts={prompts} suggestedPrompt={suggestedPrompt} createAction={createAction} />);
  return createAction;
}

const promptBox = () => screen.getByRole("textbox", { name: "Prompt" }) as HTMLInputElement;

describe("EntryComposer", () => {
  it("starts with the suggested prompt, ready to edit", () => {
    renderComposer("What went well today?");

    expect(promptBox().value).toBe("What went well today?");
  });

  it("uses a saved prompt with one click on it", () => {
    renderComposer();

    fireEvent.click(screen.getByRole("button", { name: "What made you smile?" }));

    expect(promptBox().value).toBe("What made you smile?");
  });

  it("shuffles to a different saved prompt", () => {
    renderComposer("What went well today?");

    fireEvent.click(screen.getByRole("button", { name: "Another prompt" }));

    expect(promptBox().value).toBe("What made you smile?");
  });

  it("lets you write your own prompt, or clear it", () => {
    renderComposer("What went well today?");

    fireEvent.change(promptBox(), { target: { value: "My own question" } });
    expect(promptBox().value).toBe("My own question");

    fireEvent.click(screen.getByRole("button", { name: "No prompt" }));
    expect(promptBox().value).toBe("");
  });

  it("saves the entry with its prompt, then empties the page for the next", async () => {
    const createAction = renderComposer("What went well today?");
    const entry = screen.getByRole("textbox", { name: "Entry" }) as HTMLTextAreaElement;

    fireEvent.change(entry, { target: { value: "A long walk." } });
    fireEvent.submit(entry.form!);

    await waitFor(() => expect(createAction).toHaveBeenCalledTimes(1));
    const formData = createAction.mock.calls[0][0];
    expect(formData.get("promptText")).toBe("What went well today?");
    expect(formData.get("content")).toBe("A long walk.");
    await waitFor(() => expect(entry.value).toBe(""));
  });
});
