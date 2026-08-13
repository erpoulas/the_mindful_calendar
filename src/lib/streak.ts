const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Buckets event dates into weekly counts for the last `weekCount` weeks,
 * oldest week first. Used for an Intention's streak bar chart.
 */
export function getWeeklyEventCounts(
  eventDates: Date[],
  referenceDate: Date,
  weekCount = 8,
): number[] {
  const counts = new Array(weekCount).fill(0);

  for (const eventDate of eventDates) {
    const msAgo = referenceDate.getTime() - eventDate.getTime();
    if (msAgo < 0) continue;

    const weeksAgo = Math.floor(msAgo / MS_PER_WEEK);
    if (weeksAgo >= weekCount) continue;

    counts[weekCount - 1 - weeksAgo]++;
  }

  return counts;
}
