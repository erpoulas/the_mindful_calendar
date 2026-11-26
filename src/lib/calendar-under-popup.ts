/**
 * Whether `src/app/dashboard/default.tsx` should draw the calendar under a
 * popup, judging from the request's headers.
 *
 * - Full page load (a refresh or a pasted link): yes, nothing is on screen yet.
 *   Browsers mark these Sec-Fetch-Dest: document; one that sends no
 *   Sec-Fetch-Dest also gets the calendar (slower, but never blank).
 * - Click inside the app (fetch(), Sec-Fetch-Dest: empty): no. The browser keeps
 *   the calendar already on screen and throws this output away.
 * - Save (a server action, marked with a Next-Action header): yes. Its answer
 *   redraws the page, and when the calendar came from a full load on the
 *   popup's address, the browser takes this output as the new calendar, so
 *   nothing here would blank it. (After a click from the calendar the browser
 *   throws it away instead, and refetches /dashboard on its own.)
 */
export function shouldDrawCalendarUnderPopup(requestHeaders: Pick<Headers, "get">): boolean {
  if (requestHeaders.get("sec-fetch-dest") !== "empty") return true;
  return requestHeaders.get("next-action") !== null;
}
