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

/**
 * How many event lines a month-view day can show without cutting any off.
 * Each line (an event, or the "+N more" link) takes `gap` space above it
 * plus `lineHeight`. When some events don't fit, the last line that fits is
 * kept for "+N more".
 */
export function fitEventCount({
  availableHeight,
  lineHeight,
  gap,
  eventCount,
}: {
  availableHeight: number;
  lineHeight: number;
  gap: number;
  eventCount: number;
}) {
  const linesThatFit = Math.max(0, Math.floor(availableHeight / (lineHeight + gap)));
  if (eventCount <= linesThatFit) return eventCount;
  return Math.max(0, linesThatFit - 1);
}
