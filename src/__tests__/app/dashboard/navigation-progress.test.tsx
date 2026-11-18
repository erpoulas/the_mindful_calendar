import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NavigationProgress } from "@/app/dashboard/navigation-progress";

const { location } = vi.hoisted(() => ({
  location: { pathname: "/dashboard", search: "" },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => location.pathname,
  useSearchParams: () => new URLSearchParams(location.search),
}));

function setUrl(pathname: string, search: string) {
  location.pathname = pathname;
  location.search = search;
  window.history.replaceState(null, "", `${pathname}${search}`);
}

function renderWithLinks() {
  return render(
    <>
      <NavigationProgress />
      <a href="/dashboard?panel=journals">Journal</a>
      <a href="/dashboard">Same page</a>
      <a href="https://example.com/">Elsewhere</a>
    </>,
  );
}

const bar = () => screen.getByTestId("navigation-progress");

beforeEach(() => {
  setUrl("/dashboard", "");
  // jsdom can't follow links; stop it trying (and logging) after our listener runs.
  document.addEventListener("click", preventNavigation);
});

afterEach(() => {
  document.removeEventListener("click", preventNavigation);
});

function preventNavigation(event: Event) {
  event.preventDefault();
}

describe("NavigationProgress", () => {
  it("is hidden until a link is clicked", () => {
    renderWithLinks();

    expect(bar()).toHaveAttribute("data-pending", "false");
  });

  it("shows while a click to another dashboard URL loads", () => {
    renderWithLinks();

    fireEvent.click(screen.getByText("Journal"));

    expect(bar()).toHaveAttribute("data-pending", "true");
  });

  it("hides once the new URL has loaded", () => {
    const { rerender } = renderWithLinks();
    fireEvent.click(screen.getByText("Journal"));

    setUrl("/dashboard", "?panel=journals");
    rerender(
      <>
        <NavigationProgress />
      </>,
    );

    expect(bar()).toHaveAttribute("data-pending", "false");
  });

  it("ignores links to the page already shown, and to other sites", () => {
    renderWithLinks();

    fireEvent.click(screen.getByText("Same page"));
    fireEvent.click(screen.getByText("Elsewhere"));

    expect(bar()).toHaveAttribute("data-pending", "false");
  });

  it("ignores clicks that open a new tab", () => {
    renderWithLinks();

    fireEvent.click(screen.getByText("Journal"), { ctrlKey: true });

    expect(bar()).toHaveAttribute("data-pending", "false");
  });
});
