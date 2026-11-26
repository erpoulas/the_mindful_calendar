import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { JournalPage } from "@/app/dashboard/overlays/journal-page";

type Props = Parameters<typeof JournalPage>[0];

function renderPage(overrides: Partial<Props> = {}) {
  const createAction = vi.fn<(formData: FormData) => Promise<string | null>>(async () => "new-entry");
  const updateAction = vi.fn<(entryId: string, formData: FormData) => Promise<void>>(async () => {});
  render(
    <JournalPage
      createAction={createAction}
      updateAction={updateAction}
      autosaveDelayMs={10}
      {...overrides}
    />,
  );
  return { createAction, updateAction };
}

const writingBoxes = () => screen.getAllByRole("textbox", { name: "Writing" }) as HTMLTextAreaElement[];

describe("JournalPage", () => {
  it("starts today's page by itself once you write, then keeps saving to it", async () => {
    const { createAction, updateAction } = renderPage();

    fireEvent.change(writingBoxes()[0], { target: { value: "A slow morning." } });
    await waitFor(() => expect(createAction).toHaveBeenCalledTimes(1));
    expect(createAction.mock.calls[0][0].get("content")).toBe("A slow morning.");

    fireEvent.change(writingBoxes()[0], { target: { value: "A slow morning. Then a walk." } });
    await waitFor(() => expect(updateAction).toHaveBeenCalledTimes(1));
    expect(updateAction.mock.calls[0][0]).toBe("new-entry");
    expect(updateAction.mock.calls[0][1].get("content")).toBe("A slow morning. Then a walk.");
    expect(await screen.findByText("Saved")).toBeInTheDocument();
  });

  it("saves at once when you click away", async () => {
    const { createAction } = renderPage({ autosaveDelayMs: 60_000 });

    fireEvent.change(writingBoxes()[0], { target: { value: "Quick note" } });
    fireEvent.blur(writingBoxes()[0]);

    await waitFor(() => expect(createAction).toHaveBeenCalledTimes(1));
  });

  it("doesn't start a page that was only opened, even with a suggested prompt", async () => {
    const { createAction } = renderPage({ suggestedPrompt: "What went well?" });

    fireEvent.blur(writingBoxes()[0]);
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(screen.getByRole("textbox", { name: "Prompt" })).toHaveValue("What went well?");
    expect(createAction).not.toHaveBeenCalled();
  });

  it("adds a picked prompt as its own line, with the cursor ready to answer", async () => {
    const { createAction } = renderPage({
      savedPrompts: [{ id: "p1", text: "What made you smile?" }],
      addPromptAction: vi.fn(async () => {}),
      deletePromptAction: vi.fn(async () => {}),
    });

    fireEvent.change(writingBoxes()[0], { target: { value: "Morning." } });
    fireEvent.click(screen.getByRole("button", { name: "What made you smile?" }));

    expect(screen.getByRole("textbox", { name: "Prompt" })).toHaveValue("What made you smile?");
    const answer = writingBoxes()[1];
    expect(answer).toHaveFocus();
    fireEvent.change(answer, { target: { value: "Tea with Sam." } });
    fireEvent.blur(answer);

    await waitFor(() => expect(createAction).toHaveBeenCalled());
    expect(createAction.mock.lastCall![0].get("content")).toBe(
      "Morning.\n*What made you smile?*\nTea with Sam.",
    );
  });

  it("takes a prompt off with Backspace once its line is empty", () => {
    renderPage({ suggestedPrompt: "What went well?" });
    const prompt = screen.getByRole("textbox", { name: "Prompt" });

    fireEvent.change(prompt, { target: { value: "" } });
    fireEvent.keyDown(prompt, { key: "Backspace" });

    expect(screen.queryByRole("textbox", { name: "Prompt" })).not.toBeInTheDocument();
    expect(writingBoxes()).toHaveLength(1);
  });

  it("edits an existing page, folding an older entry's separate prompt into it", async () => {
    const { updateAction, createAction } = renderPage({
      entry: { id: "e1", content: "The walk", promptText: "What went well?" },
    });

    expect(screen.getByRole("textbox", { name: "Prompt" })).toHaveValue("What went well?");
    fireEvent.change(writingBoxes()[0], { target: { value: "The long walk" } });

    await waitFor(() => expect(updateAction).toHaveBeenCalledTimes(1));
    const [entryId, formData] = updateAction.mock.calls[0];
    expect(entryId).toBe("e1");
    expect(formData.get("content")).toBe("*What went well?*\nThe long walk");
    expect(formData.get("promptText")).toBe("");
    expect(createAction).not.toHaveBeenCalled();
  });
});
