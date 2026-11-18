"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";

// Read by the dashboard page so a dismissed banner stays gone on later visits.
export const GOOGLE_BANNER_DISMISSED_COOKIE = "google_banner_dismissed";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Nudges users who haven't connected Google Calendar yet. The X hides it
// right away and saves a cookie, so the server stops rendering it.
export function GoogleConnectBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  function dismiss() {
    document.cookie = `${GOOGLE_BANNER_DISMISSED_COOKIE}=1; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
    setDismissed(true);
  }

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b bg-accent px-4 py-2 text-sm">
      <p>
        Your events aren&apos;t syncing with Google yet.{" "}
        {/* A plain <a>: this leaves the app for Google's sign-in page. */}
        <a href="/auth/google" className="font-medium underline">
          Connect Google Calendar
        </a>
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="rounded p-1 hover:bg-secondary"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
}
