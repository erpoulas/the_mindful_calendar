"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { requestGoogleSync } from "./request-google-sync";

/** Coming back to the tab within this long of the last sync doesn't sync again. */
export const TAB_RETURN_SYNC_GAP_MS = 60 * 1000;

/**
 * Shows nothing. Syncs with Google Calendar in the background after the
 * dashboard is already on screen, and redraws the page only if Google
 * brought changes. It syncs when:
 * - the dashboard first loads,
 * - the calendar moves to another week or month (start/end change),
 * - events on screen change in the app (eventsVersion changes), so the
 *   edit is sent to Google,
 * - the user comes back to this browser tab, at most once a minute.
 * Opening or closing a popup changes none of these, so it never waits on Google.
 * It calls a Route Handler, not a server action, so saves made while it
 * talks to Google never wait for it (see src/app/api/google-sync/route.ts).
 */
export function GoogleCalendarSync({
  start,
  end,
  eventsVersion,
}: {
  start: string;
  end: string;
  eventsVersion: string;
}) {
  const router = useRouter();
  const rangeRef = useRef({ start, end });
  const runningRef = useRef(false);
  const queuedRef = useRef(false);
  const lastFinishedAtRef = useRef(0);

  const syncNow = useCallback(async () => {
    // Two syncs at once could import the same Google event twice, so a
    // request that arrives mid-sync runs once the current one finishes.
    if (runningRef.current) {
      queuedRef.current = true;
      return;
    }
    runningRef.current = true;
    let changed = false;
    do {
      queuedRef.current = false;
      try {
        if (await requestGoogleSync(rangeRef.current)) changed = true;
      } catch (error) {
        // Best effort: the calendar already shows the app's own data.
        console.error("Google Calendar sync failed", error);
      }
    } while (queuedRef.current);
    runningRef.current = false;
    lastFinishedAtRef.current = Date.now();
    if (changed) router.refresh();
  }, [router]);

  useEffect(() => {
    rangeRef.current = { start, end };
    void syncNow();
  }, [start, end, eventsVersion, syncNow]);

  useEffect(() => {
    const syncWhenVisible = () => {
      if (document.visibilityState !== "visible") return;
      // Switching tabs back and forth shouldn't ask Google every time.
      if (Date.now() - lastFinishedAtRef.current < TAB_RETURN_SYNC_GAP_MS) return;
      void syncNow();
    };
    document.addEventListener("visibilitychange", syncWhenVisible);
    return () => document.removeEventListener("visibilitychange", syncWhenVisible);
  }, [syncNow]);

  return null;
}
