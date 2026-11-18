"use client";

import { useEffect, useState } from "react";
import { toWallClockDate } from "@/lib/wall-clock";

// "Now" as wall-clock time in the browser's time zone, refreshed every
// minute. It is null on the server and on the first client render, so the
// server-rendered markup never guesses "now" and mismatch the client on
// hydration.
export function useWallClockNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const update = () => setNow(toWallClockDate(new Date(), timeZone));
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, []);

  return now;
}
