// Which calendar address a closing popup should go back to, so closing it
// keeps the week or month you were looking at instead of jumping to today.

/**
 * The calendar address to remember for `pathname` + `search`, or null when
 * the address isn't the calendar itself (it's a popup). The "+N more"
 * post-its pop-out (?panel=postits) is left out, so closing it doesn't open
 * it again.
 */
export function calendarReturnUrl(pathname: string, search: URLSearchParams): string | null {
  if (pathname !== "/dashboard") return null;
  const params = new URLSearchParams(search);
  params.delete("panel");
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
