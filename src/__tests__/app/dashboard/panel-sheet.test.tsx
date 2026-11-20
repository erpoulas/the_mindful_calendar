import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RememberCalendarUrl } from "@/app/dashboard/calendar-location";
import { PanelSheet } from "@/app/dashboard/panel-sheet";

const { location, push } = vi.hoisted(() => ({
  location: { pathname: "/dashboard", search: "" },
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => location.pathname,
  useSearchParams: () => new URLSearchParams(location.search),
  useRouter: () => ({ push }),
}));

function setUrl(url: string) {
  const [pathname, search = ""] = url.split("?");
  location.pathname = pathname;
  location.search = search;
}

function tree() {
  return (
    <>
      <RememberCalendarUrl />
      {location.pathname === "/dashboard/journals" && (
        <PanelSheet open title="Journals" titlesByView={{ create: "New journal" }}>
          <p>Journal list</p>
        </PanelSheet>
      )}
    </>
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("PanelSheet", () => {
  it("closes onto the week that was on screen, and hides at once", async () => {
    setUrl("/dashboard?start=2026-12-07");
    const view = render(tree());
    setUrl("/dashboard/journals");
    view.rerender(tree());
    expect(await screen.findByText("Journal list")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(push).toHaveBeenCalledWith("/dashboard?start=2026-12-07");
    await waitFor(() => expect(screen.queryByText("Journal list")).not.toBeInTheDocument());
  });

  it("shows the title for the screen named in ?view=", async () => {
    setUrl("/dashboard/journals?view=create");
    render(tree());

    expect(await screen.findByText("New journal")).toBeInTheDocument();
  });
});
