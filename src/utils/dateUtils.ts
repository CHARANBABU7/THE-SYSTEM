// Local Calendar Date Utilities for Solo Leveling System
// Guarantees strict local timezone calendar accuracy (avoids UTC offset midnight shifts)

/**
 * Returns YYYY-MM-DD for the user's local system time.
 */
export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses YYYY-MM-DD into a local Date object (midnight local time).
 */
export function parseLocalDateKey(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Adds N days to a local date string.
 */
export function addDaysToDateKey(dateStr: string, days: number): string {
  const d = parseLocalDateKey(dateStr);
  d.setDate(d.getDate() + days);
  return getLocalDateKey(d);
}

/**
 * Returns an array of local date strings between fromDateStr and toDateStr (inclusive of fromDateStr, exclusive of toDateStr).
 * Used for multi-day missed gap detection when the user is away from the app.
 * Example: getMissedDateRange('2026-09-02', '2026-09-05') -> ['2026-09-02', '2026-09-03', '2026-09-04']
 */
export function getMissedDateRange(fromDateStr: string, toDateStr: string): string[] {
  const dates: string[] = [];
  let current = fromDateStr;

  while (current < toDateStr) {
    dates.push(current);
    current = addDaysToDateKey(current, 1);
  }

  return dates;
}
