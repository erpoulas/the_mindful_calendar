"use client";

import { useEffect } from "react";
import { saveBrowserTimezoneAction } from "@/app/actions/user-settings";

// Shows nothing. The dashboard mounts it only while the user has no saved
// time zone: it saves the browser's zone, and the page re-renders with it.
export function SaveBrowserTimezone() {
  useEffect(() => {
    void saveBrowserTimezoneAction(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);
  return null;
}
