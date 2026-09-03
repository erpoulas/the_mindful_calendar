const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * The Monday-to-next-Monday [start, end) range containing `referenceDate`,
 * in UTC. Powers the basic week-list calendar view.
 */
export function getWeekRange(referenceDate: Date): { start: Date; end: Date } {
  const midnight = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate(),
  );

  const dayOfWeek = new Date(midnight).getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const daysSinceMonday = (dayOfWeek + 6) % 7;

  const start = new Date(midnight - daysSinceMonday * MS_PER_DAY);
  const end = new Date(start.getTime() + 7 * MS_PER_DAY);

  return { start, end };
}
