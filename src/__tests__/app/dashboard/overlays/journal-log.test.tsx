import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { JournalLog } from "@/app/dashboard/overlays/journal-log";

const PAGES = [
  { id: "p2", date: "Wednesday, November 25", content: "Baked bread with Mum.", promptText: null },
  { id: "p1", date: "Monday, November 23", content: "*What went well?*\nA walk by the river.", promptText: null },
];

function renderLog() {
  render(
    <JournalLog
      today={<p>Today&apos;s writing box</p>}
      todayDate="Thursday, November 26"
      pages={PAGES}
      updateAction={vi.fn(async () => {})}
      deleteAction={vi.fn(async () => {})}
    />,
  );
}

const header = () => screen.getByRole("heading", { level: 3 });
const older = () => screen.getByRole("button", { name: "Older page" });
const newer = () => screen.getByRole("button", { name: "Newer page" });

describe("JournalLog", () => {
  it("opens on today's page, with nothing newer", () => {
    renderLog();

    expect(header()).toHaveTextContent("Today · Thursday, November 26");
    expect(screen.getByText("Today's writing box")).toBeVisible();
    expect(newer()).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Back to today" })).not.toBeInTheDocument();
  });

  it("turns to older pages and back to today", () => {
    renderLog();

    fireEvent.click(older());
    expect(header()).toHaveTextContent("Wednesday, November 25");
    expect(screen.getByDisplayValue("Baked bread with Mum.")).toBeVisible();
    expect(screen.getByText("Today's writing box")).not.toBeVisible();

    fireEvent.click(older());
    expect(header()).toHaveTextContent("Monday, November 23");
    expect(older()).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Back to today" }));
    expect(header()).toHaveTextContent("Today · Thursday, November 26");
  });

  it("turns pages with the arrow keys, but not while you type", () => {
    renderLog();

    fireEvent.keyDown(document.body, { key: "ArrowLeft" });
    expect(header()).toHaveTextContent("Wednesday, November 25");

    fireEvent.keyDown(screen.getByDisplayValue("Baked bread with Mum."), { key: "ArrowLeft" });
    expect(header()).toHaveTextContent("Wednesday, November 25");

    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    expect(header()).toHaveTextContent("Today · Thursday, November 26");
  });

  it("searches past pages and jumps to the one you pick", () => {
    renderLog();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search pages" }), { target: { value: "river" } });
    const results = screen.getByRole("list", { name: "Search results" });
    expect(within(results).getAllByRole("button")).toHaveLength(1);

    fireEvent.click(within(results).getByRole("button", { name: /Monday, November 23/ }));
    expect(header()).toHaveTextContent("Monday, November 23");
    expect(screen.getByRole("searchbox", { name: "Search pages" })).toHaveValue("");
    expect(screen.queryByRole("list", { name: "Search results" })).not.toBeInTheDocument();
  });

  it("says so when no page matches", () => {
    renderLog();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search pages" }), { target: { value: "dragons" } });
    expect(screen.getByText(/No pages mention “dragons”/)).toBeInTheDocument();
  });
});
