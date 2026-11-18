import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  GOOGLE_BANNER_DISMISSED_COOKIE,
  GoogleConnectBanner,
} from "@/app/dashboard/google-connect-banner";

function clearDismissCookie() {
  document.cookie = `${GOOGLE_BANNER_DISMISSED_COOKIE}=; path=/; max-age=0`;
}

describe("GoogleConnectBanner", () => {
  afterEach(clearDismissCookie);

  it("links to the Google connect flow", () => {
    render(<GoogleConnectBanner />);

    expect(screen.getByRole("link", { name: /connect google calendar/i })).toHaveAttribute(
      "href",
      "/auth/google",
    );
  });

  it("disappears when dismissed and remembers that in a cookie", () => {
    render(<GoogleConnectBanner />);

    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));

    expect(screen.queryByRole("link", { name: /connect google calendar/i })).toBeNull();
    expect(document.cookie).toContain(`${GOOGLE_BANNER_DISMISSED_COOKIE}=1`);
  });
});
