import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { MonthDayCell } from "@/app/dashboard/month-day-cell";

function renderCell() {
  render(
    <DndContext>
      <MonthDayCell
        dayKey="2026-11-18"
        dayNumber={18}
        inMonth
        weekStartHref="/dashboard?start=2026-11-18"
        overflow={0}
        events={[
          {
            id: "own-1",
            title: "Gym",
            startAt: new Date("2026-11-18T07:00:00Z"),
            href: "/dashboard?panel=calendar-event&view=edit&id=own-1",
            isGoogle: false,
          },
          {
            id: "google:abc",
            title: "Dentist",
            startAt: new Date("2026-11-18T09:00:00Z"),
            href: "https://calendar.google.com/event?eid=abc",
            isGoogle: true,
          },
        ]}
      />
    </DndContext>,
  );
}

describe("MonthDayCell", () => {
  it("opens our own events in the app's edit popup", () => {
    renderCell();

    const link = screen.getByRole("link", { name: "Gym" });
    expect(link).toHaveAttribute("href", "/dashboard?panel=calendar-event&view=edit&id=own-1");
    expect(link).not.toHaveAttribute("target");
  });

  it("opens Google events in Google Calendar, in a new tab, marked with the G badge", () => {
    renderCell();

    const link = screen.getByRole("link", { name: /Dentist/ });
    expect(link).toHaveAttribute("href", "https://calendar.google.com/event?eid=abc");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("title", "Dentist (from Google Calendar)");
    expect(screen.getByLabelText("Google Calendar event")).toBeInTheDocument();
  });
});
