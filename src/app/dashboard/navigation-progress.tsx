"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** The URL as a comparable string, the same whichever way it was read. */
function toUrlKey(pathname: string, search: URLSearchParams) {
  return `${pathname}?${search.toString()}`;
}

/**
 * A thin bar along the top of the screen while a clicked link loads, so a
 * click always gets instant feedback. Every popup is a URL change that
 * the server has to render, which can take a moment.
 *
 * It remembers the URL the click was made from; once the URL changes, the
 * new page has arrived and the bar hides.
 */
export function NavigationProgress() {
  const currentUrl = toUrlKey(usePathname(), useSearchParams());
  const [pendingFromUrl, setPendingFromUrl] = useState<string | null>(null);
  const pending = pendingFromUrl === currentUrl;

  useEffect(() => {
    function showForLinkClick(event: MouseEvent) {
      // Modifier keys and middle clicks open a new tab; this one stays put.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) {
        return;
      }
      const target = new URL(link.href);
      const fromUrl = toUrlKey(window.location.pathname, new URLSearchParams(window.location.search));
      if (target.origin !== window.location.origin) return;
      if (toUrlKey(target.pathname, target.searchParams) === fromUrl) return;
      setPendingFromUrl(fromUrl);
    }
    document.addEventListener("click", showForLinkClick);
    return () => document.removeEventListener("click", showForLinkClick);
  }, []);

  return (
    <div
      aria-hidden
      data-testid="navigation-progress"
      data-pending={pending}
      // Waits 150ms before growing, so quick loads never flash the bar.
      className={`pointer-events-none fixed top-0 left-0 z-[100] h-0.5 bg-primary ${
        pending ? "w-4/5 transition-[width] delay-150 duration-[4000ms] ease-out" : "w-0"
      }`}
    />
  );
}
