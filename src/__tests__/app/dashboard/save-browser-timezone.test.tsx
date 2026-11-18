import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { SaveBrowserTimezone } from "@/app/dashboard/save-browser-timezone";
import { saveBrowserTimezoneAction } from "@/app/actions/user-settings";

vi.mock("@/app/actions/user-settings", () => ({
  saveBrowserTimezoneAction: vi.fn(async () => {}),
}));

describe("SaveBrowserTimezone", () => {
  it("saves the browser's time zone once and shows nothing", () => {
    const { container } = render(<SaveBrowserTimezone />);

    expect(saveBrowserTimezoneAction).toHaveBeenCalledOnce();
    expect(saveBrowserTimezoneAction).toHaveBeenCalledWith(
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
