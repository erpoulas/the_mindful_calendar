import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, waitFor } from "@testing-library/react";
import { GoogleCalendarSync } from "@/app/dashboard/google-calendar-sync";
import { syncGoogleCalendarAction } from "@/app/actions/google-calendar";

const { refresh, router } = vi.hoisted(() => {
  const refresh = vi.fn();
  // Next's useRouter returns the same object on every render.
  return { refresh, router: { refresh } };
});

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

vi.mock("@/app/actions/google-calendar", () => ({
  syncGoogleCalendarAction: vi.fn(async () => false),
}));

const syncAction = vi.mocked(syncGoogleCalendarAction);

const WEEK = { start: "2026-11-16T00:00:00.000Z", end: "2026-11-23T00:00:00.000Z" };
const NEXT_WEEK = { start: "2026-11-23T00:00:00.000Z", end: "2026-11-30T00:00:00.000Z" };

afterEach(() => {
  vi.clearAllMocks();
});

describe("GoogleCalendarSync", () => {
  it("syncs the range on screen and shows nothing", async () => {
    const { container } = render(<GoogleCalendarSync {...WEEK} eventsVersion="v1" />);

    await waitFor(() => expect(syncAction).toHaveBeenCalledWith(WEEK));
    expect(container).toBeEmptyDOMElement();
  });

  it("redraws the page only when the sync changed something", async () => {
    syncAction.mockResolvedValueOnce(true);
    render(<GoogleCalendarSync {...WEEK} eventsVersion="v1" />);

    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
  });

  it("doesn't redraw when nothing changed", async () => {
    render(<GoogleCalendarSync {...WEEK} eventsVersion="v1" />);

    await waitFor(() => expect(syncAction).toHaveBeenCalledOnce());
    expect(refresh).not.toHaveBeenCalled();
  });

  it("doesn't sync again when the page redraws with the same range, like opening a popup", async () => {
    const { rerender } = render(<GoogleCalendarSync {...WEEK} eventsVersion="v1" />);
    await waitFor(() => expect(syncAction).toHaveBeenCalledOnce());

    rerender(<GoogleCalendarSync {...WEEK} eventsVersion="v1" />);

    expect(syncAction).toHaveBeenCalledOnce();
  });

  it("syncs again when the range or the events on screen change", async () => {
    const { rerender } = render(<GoogleCalendarSync {...WEEK} eventsVersion="v1" />);
    await waitFor(() => expect(syncAction).toHaveBeenCalledTimes(1));

    rerender(<GoogleCalendarSync {...NEXT_WEEK} eventsVersion="v1" />);
    await waitFor(() => expect(syncAction).toHaveBeenLastCalledWith(NEXT_WEEK));

    rerender(<GoogleCalendarSync {...NEXT_WEEK} eventsVersion="v2" />);
    await waitFor(() => expect(syncAction).toHaveBeenCalledTimes(3));
  });

  it("syncs again when the user comes back to the tab", async () => {
    render(<GoogleCalendarSync {...WEEK} eventsVersion="v1" />);
    await waitFor(() => expect(syncAction).toHaveBeenCalledTimes(1));

    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await waitFor(() => expect(syncAction).toHaveBeenCalledTimes(2));
  });

  it("never runs two syncs at once; a request made meanwhile runs after", async () => {
    let finishFirst!: (changed: boolean) => void;
    syncAction.mockImplementationOnce(() => new Promise((resolve) => (finishFirst = resolve)));
    const { rerender } = render(<GoogleCalendarSync {...WEEK} eventsVersion="v1" />);
    await waitFor(() => expect(syncAction).toHaveBeenCalledTimes(1));

    rerender(<GoogleCalendarSync {...NEXT_WEEK} eventsVersion="v1" />);
    expect(syncAction).toHaveBeenCalledTimes(1);

    await act(async () => finishFirst(false));
    await waitFor(() => expect(syncAction).toHaveBeenLastCalledWith(NEXT_WEEK));
  });
});
