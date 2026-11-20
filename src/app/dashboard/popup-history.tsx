"use client";

import { createContext, useContext, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  canGoBack,
  canGoForward,
  emptyPopupHistory,
  recordVisit,
  type PopupHistory,
} from "@/lib/popup-history";

const PopupHistoryContext = createContext<PopupHistory>(emptyPopupHistory);

/** Popups live under /dashboard/<name>; plain /dashboard means none is open. */
function historyFor(url: string, pathname: string, history: PopupHistory) {
  return pathname.startsWith("/dashboard/") ? recordVisit(history, url) : emptyPopupHistory;
}

/**
 * Remembers the screens visited inside the open popup. It sits in the
 * dashboard layout around the popup slot, so it stays mounted while you move
 * between popups, and starts over each time the popup closes.
 */
export function PopupHistoryProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const url = search ? `${pathname}?${search}` : pathname;

  const [state, setState] = useState(() => ({
    url,
    history: historyFor(url, pathname, emptyPopupHistory),
  }));

  // Updating state during render when the URL changes, rather than in an
  // effect, means the buttons never show a stale history for a frame.
  let { history } = state;
  if (state.url !== url) {
    history = historyFor(url, pathname, history);
    setState({ url, history });
  }

  return <PopupHistoryContext.Provider value={history}>{children}</PopupHistoryContext.Provider>;
}

/**
 * Back and forward buttons for the popup header, like a browser's. Hidden
 * on the first screen, where there's nowhere to go yet.
 */
export function PopupHistoryButtons() {
  const history = useContext(PopupHistoryContext);
  const router = useRouter();
  const hasBack = canGoBack(history);
  const hasForward = canGoForward(history);
  if (!hasBack && !hasForward) return null;

  const buttonClass =
    "rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground";

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Back"
        disabled={!hasBack}
        onClick={() => router.push(history.entries[history.index - 1])}
        className={buttonClass}
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        aria-label="Forward"
        disabled={!hasForward}
        onClick={() => router.push(history.entries[history.index + 1])}
        className={buttonClass}
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
