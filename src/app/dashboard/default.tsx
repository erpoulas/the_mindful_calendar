import { headers } from "next/headers";
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
//
// Browsers mark fetch() requests, which in-app navigations use, with
// Sec-Fetch-Dest: empty; full page loads say "document". A browser that
// sends neither still gets the calendar: slower, but never blank.
export default async function CalendarUnderPanel() {
  const requestHeaders = await headers();
  if (requestHeaders.get("sec-fetch-dest") === "empty") return null;
  return <DashboardPage params={Promise.resolve({})} searchParams={Promise.resolve({})} />;
}
