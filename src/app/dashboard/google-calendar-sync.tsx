"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { syncGoogleCalendarAction } from "@/app/actions/google-calendar";

/**
 * Shows nothing. Syncs with Google Calendar in the background after the
 * dashboard is already on screen, and redraws the page only if Google
 * brought changes. It syncs when:
 * - the dashboard first loads,
 * - the calendar moves to another week or month (start/end change),
 * - events on screen change in the app (eventsVersion changes), so the
 *   edit is sent to Google,
 * - the user comes back to this browser tab.
 * Opening or closing a popup changes none of these, so it never waits on Google.
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
        if (await syncGoogleCalendarAction(rangeRef.current)) changed = true;
      } catch (error) {
        // Best effort: the calendar already shows the app's own data.
        console.error("Google Calendar sync failed", error);
      }
    } while (queuedRef.current);
    runningRef.current = false;
    if (changed) router.refresh();
  }, [router]);

  useEffect(() => {
    rangeRef.current = { start, end };
    void syncNow();
  }, [start, end, eventsVersion, syncNow]);

  useEffect(() => {
    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") void syncNow();
    };
    document.addEventListener("visibilitychange", syncWhenVisible);
    return () => document.removeEventListener("visibilitychange", syncWhenVisible);
  }, [syncNow]);

  return null;
}
