// The screens visited inside an open popup, so its back/forward buttons can
// step through them like a browser's. The browser's own history can't do
// this: going back from the popup's first screen would close the popup, and
// a page can't ask the browser whether there's a screen to go forward to.

export type PopupHistory = {
  /** Popup URLs in the order they were visited. */
  entries: string[];
  /** Which entry is on screen now; -1 when empty. */
  index: number;
};

export const emptyPopupHistory: PopupHistory = { entries: [], index: -1 };

/**
 * Records that the popup now shows `url`. Landing on the screen just before
 * or after the current one counts as a step back or forward (that's what
 * the buttons, or the browser's own back/forward, just did), so the later
 * screens are kept. Any other screen is a new visit: it drops the screens
 * ahead of the current one, as a browser does.
 */
export function recordVisit(history: PopupHistory, url: string): PopupHistory {
  const { entries, index } = history;
  if (entries[index] === url) return history;
  if (entries[index - 1] === url) return { entries, index: index - 1 };
  if (entries[index + 1] === url) return { entries, index: index + 1 };
  return { entries: [...entries.slice(0, index + 1), url], index: index + 1 };
}

export function canGoBack(history: PopupHistory) {
  return history.index > 0;
}

export function canGoForward(history: PopupHistory) {
  return history.index < history.entries.length - 1;
}
