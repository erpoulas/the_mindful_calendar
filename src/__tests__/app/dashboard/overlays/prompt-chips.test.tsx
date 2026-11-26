import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PromptChips } from "@/app/dashboard/overlays/prompt-chips";

// The add stays in progress until the test is over, as a save does until
// the server's fresh list arrives (there is no server here).
function renderChips() {
  const onPick = vi.fn();
  const addAction = vi.fn<(formData: FormData) => Promise<void>>(() => new Promise(() => {}));
  const deleteAction = vi.fn<(promptId: string) => Promise<void>>(async () => {});
  render(
    <PromptChips
      prompts={[{ id: "p1", text: "What went well?" }]}
      onPick={onPick}
      addAction={addAction}
      deleteAction={deleteAction}
    />,
  );
  return { onPick, addAction, deleteAction };
}

describe("PromptChips", () => {
  it("puts a saved prompt on the page with one click", () => {
    const { onPick } = renderChips();

    fireEvent.click(screen.getByRole("button", { name: "What went well?" }));

    expect(onPick).toHaveBeenCalledWith("What went well?");
  });

  it("saves a new prompt from the blank line on Enter, and empties it for the next", async () => {
    const { addAction } = renderChips();
    const box = screen.getByRole("textbox", { name: "New prompt" }) as HTMLInputElement;

    fireEvent.change(box, { target: { value: "Why?" } });
    fireEvent.submit(box.form!);

    expect(await screen.findByRole("button", { name: "Why?" })).toBeInTheDocument();
    expect(box.value).toBe("");
    await waitFor(() => expect(addAction).toHaveBeenCalledTimes(1));
    expect(addAction.mock.calls[0][0].get("text")).toBe("Why?");
  });

  it("has no separate Save button", () => {
    renderChips();

    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
  });

  it("removes a saved prompt with its ✕", async () => {
    const { deleteAction } = renderChips();

    fireEvent.click(screen.getByRole("button", { name: "Remove prompt: What went well?" }));

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "What went well?" })).not.toBeInTheDocument(),
    );
    expect(deleteAction).toHaveBeenCalledWith("p1");
  });
});
