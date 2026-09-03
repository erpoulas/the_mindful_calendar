import { getWeekRange } from "./calendar-week";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * The calendar-month boundaries for `referenceDate`, plus a Monday-aligned
 * grid range padded with the trailing/leading days of adjacent months so
 * the month view always renders full weeks.
 */
export function getMonthGrid(referenceDate: Date) {
  const monthStart = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1),
  );
  const monthEnd = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() + 1, 1),
  );

  const gridStart = getWeekRange(monthStart).start;
  const lastDayOfMonth = new Date(monthEnd.getTime() - MS_PER_DAY);
  const gridEnd = getWeekRange(lastDayOfMonth).end;

  return { monthStart, monthEnd, gridStart, gridEnd };
}
