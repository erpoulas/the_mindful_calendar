import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DeleteJournalButton } from "@/app/dashboard/overlays/delete-journal-button";

function renderButton(entryCount: number) {
  const deleteAction = vi.fn<(formData: FormData) => Promise<void>>(async () => {});
  render(<DeleteJournalButton journalName="Gratitude" entryCount={entryCount} deleteAction={deleteAction} />);
  fireEvent.click(screen.getByRole("button", { name: "Delete journal" }));
  return deleteAction;
}

describe("DeleteJournalButton", () => {
  it("asks whether to delete the past entries' events too, and deletes them on yes", async () => {
    const deleteAction = renderButton(4);

    expect(screen.getByText(/Also delete the events of its 4 past entries/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Yes, delete them" }));

    await waitFor(() => expect(deleteAction).toHaveBeenCalledTimes(1));
    expect(deleteAction.mock.calls[0][0].get("pastEvents")).toBe("delete");
  });

  it("keeps them on no", async () => {
    const deleteAction = renderButton(1);

    expect(screen.getByText(/Also delete the event of its past entry/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "No, keep them" }));

    await waitFor(() => expect(deleteAction).toHaveBeenCalledTimes(1));
    expect(deleteAction.mock.calls[0][0].get("pastEvents")).toBe("keep");
  });

  it("just confirms when there are no entries, and can be cancelled", () => {
    const deleteAction = renderButton(0);

    expect(screen.queryByRole("button", { name: "Yes, delete them" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(deleteAction).not.toHaveBeenCalled();
  });
});
