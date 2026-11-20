import { describe, expect, it } from "vitest";
import {
  canGoBack,
  canGoForward,
  emptyPopupHistory,
  recordVisit,
  type PopupHistory,
} from "@/lib/popup-history";

function visitAll(...urls: string[]): PopupHistory {
  return urls.reduce(recordVisit, emptyPopupHistory);
}

describe("popup history", () => {
  it("starts empty, with nowhere to go", () => {
    expect(canGoBack(emptyPopupHistory)).toBe(false);
    expect(canGoForward(emptyPopupHistory)).toBe(false);
  });

  it("adds each new screen to the end and makes it current", () => {
    const history = visitAll("/a", "/b", "/c");

    expect(history).toEqual({ entries: ["/a", "/b", "/c"], index: 2 });
    expect(canGoBack(history)).toBe(true);
    expect(canGoForward(history)).toBe(false);
  });

  it("can't go back from the first screen", () => {
    expect(canGoBack(visitAll("/a"))).toBe(false);
  });

  it("ignores a repeat of the current screen", () => {
    expect(visitAll("/a", "/b", "/b")).toEqual({ entries: ["/a", "/b"], index: 1 });
  });

  it("steps back when the previous screen is visited, keeping the later ones", () => {
    const history = visitAll("/a", "/b", "/c", "/b");

    expect(history).toEqual({ entries: ["/a", "/b", "/c"], index: 1 });
    expect(canGoForward(history)).toBe(true);
  });

  it("steps forward when the next screen is visited", () => {
    const history = visitAll("/a", "/b", "/c", "/b", "/c");

    expect(history).toEqual({ entries: ["/a", "/b", "/c"], index: 2 });
  });

  it("drops the forward screens when a new screen is visited after going back", () => {
    const history = visitAll("/a", "/b", "/c", "/b", "/d");

    expect(history).toEqual({ entries: ["/a", "/b", "/d"], index: 2 });
    expect(canGoForward(history)).toBe(false);
  });
});
