import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PopupHistoryButtons, PopupHistoryProvider } from "@/app/dashboard/popup-history";

const { location, push, close } = vi.hoisted(() => ({
  location: { pathname: "/dashboard", search: "" },
  push: vi.fn(),
  close: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => location.pathname,
  useSearchParams: () => new URLSearchParams(location.search),
  useRouter: () => ({ push }),
}));

function tree() {
  return (
    <PopupHistoryProvider>
      <PopupHistoryButtons onClose={close} />
    </PopupHistoryProvider>
  );
}

/** Renders on the first URL, then moves through the rest. */
function visit(...urls: string[]) {
  const [first, ...rest] = urls;
  setUrl(first);
  const view = render(tree());
  for (const url of rest) {
    setUrl(url);
    view.rerender(tree());
  }
  return view;
}

function setUrl(url: string) {
  const [pathname, search = ""] = url.split("?");
  location.pathname = pathname;
  location.search = search;
}

const back = () => screen.queryByRole("button", { name: "Back" });
const forward = () => screen.queryByRole("button", { name: "Forward" });

beforeEach(() => {
  push.mockReset();
  close.mockReset();
});

describe("PopupHistoryButtons", () => {
  it("are there from the popup's first screen, where Back closes it", () => {
    visit("/dashboard/projects");

    // Always drawn, so the header never shifts when you first click inside.
    expect(forward()).toBeDisabled();
    fireEvent.click(back()!);

    expect(close).toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("leave out Forward on a popup with only one screen", () => {
    setUrl("/dashboard/dopamine-menu");
    render(
      <PopupHistoryProvider>
        <PopupHistoryButtons onClose={close} singleScreen />
      </PopupHistoryProvider>,
    );

    expect(forward()).toBeNull();
    fireEvent.click(back()!);
    expect(close).toHaveBeenCalled();
  });

  it("go back to the previous screen", () => {
    visit("/dashboard/projects", "/dashboard/projects?view=detail&id=p1");

    expect(forward()).toBeDisabled();
    fireEvent.click(back()!);

    expect(push).toHaveBeenCalledWith("/dashboard/projects");
  });

  it("go forward again after going back", () => {
    visit(
      "/dashboard/projects",
      "/dashboard/projects?view=detail&id=p1",
      "/dashboard/projects",
    );

    fireEvent.click(forward()!);

    expect(push).toHaveBeenCalledWith("/dashboard/projects?view=detail&id=p1");
  });

  it("follow you from one popup into another", () => {
    visit("/dashboard/projects?view=detail&id=p1", "/dashboard/event?view=new&title=Draft");

    fireEvent.click(back()!);

    expect(push).toHaveBeenCalledWith("/dashboard/projects?view=detail&id=p1");
  });

  it("start over once the popup is closed", () => {
    visit(
      "/dashboard/projects",
      "/dashboard/projects?view=detail&id=p1",
      "/dashboard",
      "/dashboard/journals",
    );

    expect(forward()).toBeDisabled();
    fireEvent.click(back()!);
    expect(close).toHaveBeenCalled();
  });
});
