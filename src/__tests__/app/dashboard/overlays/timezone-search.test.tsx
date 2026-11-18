import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TimezoneSearch } from "@/app/dashboard/overlays/timezone-search";

const boulder = { label: "Boulder, Colorado, US", timezone: "America/Denver", zoneName: "Mountain Time" };

vi.mock("@/app/actions/user-settings", () => ({
  searchTimezonesAction: vi.fn(async (query: string) => (query === "boulder" ? [boulder] : [])),
}));

describe("TimezoneSearch", () => {
  it("shows matches for a city and hands back the picked one", async () => {
    const onPick = vi.fn();
    render(<TimezoneSearch id="timezone" onPick={onPick} />);

    await userEvent.type(screen.getByRole("searchbox"), "boulder");
    await userEvent.click(await screen.findByRole("button", { name: /boulder, colorado/i }));

    expect(onPick).toHaveBeenCalledWith(boulder);
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });
});
