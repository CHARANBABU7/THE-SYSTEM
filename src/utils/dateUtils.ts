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

export interface StreakHistoryEntry {
  date: string;
  completed: boolean;
  isRestDay?: boolean;
}

/**
 * Calculates current unbroken consecutive streak.
 * 
 * Rules:
 * 1. An unbroken streak increases for every consecutive day that is either:
 *    - Completed (all quests cleared)
 *    - Protected by a Rest Day (Monarch's Aegis)
 * 2. If today is completed or a rest day: streak includes today and counts backward consecutively.
 * 3. If today is NOT yet completed/rest: streak is yesterday's unbroken chain (so the player does not lose their streak during the active day).
 * 4. If yesterday was skipped/missed (not completed, not rest day): streak is 0 (or 1 if today is completed).
 */
export function calculateCurrentStreak(
  history: StreakHistoryEntry[],
  todayDateStr: string,
  isTodaySafe: boolean
): number {
  let streak = 0;

  if (isTodaySafe) {
    streak = 1;
    let checkDate = addDaysToDateKey(todayDateStr, -1);
    while (true) {
      const entry = history.find(h => h.date === checkDate);
      if (entry && (entry.completed || entry.isRestDay)) {
        streak += 1;
        checkDate = addDaysToDateKey(checkDate, -1);
      } else {
        break;
      }
    }
  } else {
    let checkDate = addDaysToDateKey(todayDateStr, -1);
    while (true) {
      const entry = history.find(h => h.date === checkDate);
      if (entry && (entry.completed || entry.isRestDay)) {
        streak += 1;
        checkDate = addDaysToDateKey(checkDate, -1);
      } else {
        break;
      }
    }
  }

  return streak;
}

/**
 * Calculates the all-time highest unbroken streak from history logs.
 */
export function calculateBestStreak(
  history: StreakHistoryEntry[],
  todayDateStr: string,
  isTodaySafe: boolean,
  storedBestStreak: number = 0
): number {
  const currentStreak = calculateCurrentStreak(history, todayDateStr, isTodaySafe);

  const validDates = new Set(
    history
      .filter(h => h.completed || h.isRestDay)
      .map(h => h.date)
  );

  if (isTodaySafe) {
    validDates.add(todayDateStr);
  }

  const sortedDates = Array.from(validDates).sort();
  let maxChain = 0;
  let currentChain = 0;
  let prevDate: string | null = null;

  for (const d of sortedDates) {
    if (!prevDate) {
      currentChain = 1;
    } else {
      const expectedNext = addDaysToDateKey(prevDate, 1);
      if (d === expectedNext) {
        currentChain += 1;
      } else {
        currentChain = 1;
      }
    }
    if (currentChain > maxChain) {
      maxChain = currentChain;
    }
    prevDate = d;
  }

  return Math.max(storedBestStreak, currentStreak, maxChain);
}

