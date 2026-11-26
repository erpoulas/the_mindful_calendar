import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { MonthDayCell } from "@/app/dashboard/month-day-cell";

vi.mock("@/app/dashboard/use-wall-clock-now", () => ({ useWallClockNow: () => null }));

function makeEvents(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `event-${index}`,
    title: `Event number ${index + 1} with a long title`,
    intentions: [],
    href: `/dashboard/event?view=edit&id=event-${index}`,
  })) as unknown as Parameters<typeof MonthDayCell>[0]["events"];
}

/**
 * jsdom has no layout, so fake one: the day's box is `cellHeight` px tall
 * (no padding), and the day number takes the top 20px. With 16px text,
 * each event line is 20px plus a 4px gap.
 */
function fakeDayBox(cellHeight: number) {
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(cellHeight);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
    this: HTMLElement,
  ) {
    const isDayNumber = this.tagName === "A" && this.textContent === "20";
    return { top: 0, bottom: isDayNumber ? 20 : cellHeight } as DOMRect;
  });
}

function renderDay(eventCount: number) {
  render(
    <DndContext>
      <MonthDayCell
        dayKey="2026-11-20"
        dayNumber={20}
        inMonth
        weekStartHref="/dashboard?start=2026-11-20"
        events={makeEvents(eventCount)}
      />
    </DndContext>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("MonthDayCell", () => {
  it("shows every event when the day has room for them", () => {
    fakeDayBox(20 + 3 * 24);
    renderDay(3);

    expect(screen.getAllByText(/Event number/)).toHaveLength(3);
    expect(screen.queryByText(/more/)).not.toBeInTheDocument();
  });

  it("shows only whole events on a busy day and counts the rest in +N more", () => {
    fakeDayBox(20 + 3 * 24);
    renderDay(5);

    expect(screen.getAllByText(/Event number/)).toHaveLength(2);
    expect(screen.getByText("+3 more")).toBeInTheDocument();
  });

  it("shows just +N more when only one line fits", () => {
    fakeDayBox(20 + 30);
    renderDay(4);

    expect(screen.queryByText(/Event number/)).not.toBeInTheDocument();
    expect(screen.getByText("+4 more")).toBeInTheDocument();
  });
});
