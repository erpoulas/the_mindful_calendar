import { headers } from "next/headers";
import { shouldDrawCalendarUnderPopup } from "@/lib/calendar-under-popup";
import DashboardPage from "./page";

// The calendar under a popup, for addresses like /dashboard/dopamine-menu.
//
// - Full page load (a refresh or a pasted link): there's no calendar on
//   screen yet, so render it. The URL's ?start= isn't available here, so it
//   shows the current week.
// - Click inside the app: the browser keeps the calendar already on screen
//   and throws this slot's server output away (Next.js reuses the active
//   segment in a "default" slot, and refetches it from its own URL when the
//   page refreshes). Rendering it here would re-run every calendar query for
//   nothing, which is exactly the cost popups-as-routes are meant to save.
// - Save in the popup: render it. If the calendar on screen came from a full
//   load (the case above), the browser has no other calendar to keep, so it
//   shows whatever this returns, and null would blank it.
//
// The rules, from the request headers, are in shouldDrawCalendarUnderPopup.
export default async function CalendarUnderPanel() {
  if (!shouldDrawCalendarUnderPopup(await headers())) return null;
  return <DashboardPage params={Promise.resolve({})} searchParams={Promise.resolve({})} />;
}
