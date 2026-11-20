import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventForm } from "@/app/dashboard/overlays/event-form";

describe("EventForm intentions", () => {
  it("shows each intention's color dot next to its name, and none when it has no color", () => {
    render(
      <EventForm
        action={vi.fn(async () => undefined)}
        heading="New event"
        submitLabel="Add event"
        pendingLabel="Adding..."
        projects={[]}
        intentions={[
          { id: "i1", name: "Health", color: "sage" },
          { id: "i2", name: "Family", color: null },
        ]}
        mainTimeZone="America/Denver"
      />,
    );

    expect(screen.getByLabelText(/Health/)).toBeInTheDocument();
    expect(screen.getByTitle("Sage")).toBeInTheDocument();
    expect(screen.getAllByTitle(/./).filter((el) => el.tagName === "SPAN")).toHaveLength(1);
  });
});
