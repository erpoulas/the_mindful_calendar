// A project's due date is a calendar day, not a moment: it's saved from a
// date box (<input type="date">, "2026-10-12") as midnight UTC. So it's
// always read back in UTC, which shows the same day on the server and in
// any browser, wherever the user lives.

const DUE_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** E.g. "Mon, Oct 12, 2026". */
export function formatDueDate(date: Date) {
  return DUE_DATE_FORMAT.format(date);
}

/** The date box's value for a stored due date, e.g. "2026-10-12". */
export function dueDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** The due date to save from a date box's value; null clears it. */
export function dueDateFromInput(value: string) {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const date = new Date(`${trimmed}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}
