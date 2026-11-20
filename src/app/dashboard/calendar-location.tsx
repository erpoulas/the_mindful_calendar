"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { calendarReturnUrl } from "@/lib/calendar-return-url";

// The calendar address last on screen, kept in memory for this tab only.
let lastCalendarUrl: string | null = null;

/** Where closing a popup should go: the week or month you were looking at. */
export function getCalendarReturnUrl() {
  return lastCalendarUrl ?? dashboardRoutes.calendar();
}

/**
 * Shows nothing. Remembers the calendar's address (its ?start= and ?mode=)
 * each time it changes, so a popup opened from next week closes back onto
 * next week. Lives in the dashboard layout, which stays mounted throughout.
 */
export function RememberCalendarUrl() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    const url = calendarReturnUrl(pathname, search);
    if (url) lastCalendarUrl = url;
  }, [pathname, search]);

  return null;
}
