import { 
  getLocalDateKey, 
  addDaysToDateKey, 
  getMissedDateRange, 
  calculateCurrentStreak, 
  calculateBestStreak,
  StreakHistoryEntry 
} from './src/utils/dateUtils';

console.log('================================================================');
console.log('RUNNING THE 10-POINT AUTHORITATIVE STREAK & DAYS CLEARED TEST SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ [PASS] Test ${totalTests}: ${testName}`);
  } else {
    console.error(`❌ [FAIL] Test ${totalTests}: ${testName}`);
    if (detail) console.error(`   Detail: ${detail}`);
    process.exit(1);
  }
}

// -------------------------------------------------------------
// TEST 1: Brand New Player (No History)
// -------------------------------------------------------------
const today = '2026-09-08';
const historyEmpty: StreakHistoryEntry[] = [];
const streak1 = calculateCurrentStreak(historyEmpty, today, false);
const best1 = calculateBestStreak(historyEmpty, today, false, 0);
assert(streak1 === 0, 'Brand new player has 0 current streak before clearing day 1', `Expected 0, got ${streak1}`);
assert(best1 === 0, 'Brand new player has 0 best streak', `Expected 0, got ${best1}`);

// -------------------------------------------------------------
// TEST 2: Day 1 Completed
// -------------------------------------------------------------
const historyDay1: StreakHistoryEntry[] = [
  { date: '2026-09-08', completed: true }
];
const streak2 = calculateCurrentStreak(historyDay1, '2026-09-08', true);
const best2 = calculateBestStreak(historyDay1, '2026-09-08', true, 0);
assert(streak2 === 1, 'Day 1 completion yields 1 Day Streak', `Expected 1, got ${streak2}`);
assert(best2 === 1, 'Best streak updates to 1', `Expected 1, got ${best2}`);

// -------------------------------------------------------------
// TEST 3: Day 2 In Progress (Morning after Day 1 Complete)
// -------------------------------------------------------------
// User completed Day 1 yesterday, today is Day 2 and not finished yet
const streak3 = calculateCurrentStreak(historyDay1, '2026-09-09', false);
assert(streak3 === 1, 'Streak stays intact at 1 while Day 2 is in progress', `Expected 1, got ${streak3}`);

// -------------------------------------------------------------
// TEST 4: Day 2 Completed (Consecutive Day 2)
// -------------------------------------------------------------
const historyDay2: StreakHistoryEntry[] = [
  { date: '2026-09-09', completed: true },
  { date: '2026-09-08', completed: true },
];
const streak4 = calculateCurrentStreak(historyDay2, '2026-09-09', true);
const best4 = calculateBestStreak(historyDay2, '2026-09-09', true, best2);
assert(streak4 === 2, '2 consecutive completed days yield 2 Day Streak', `Expected 2, got ${streak4}`);
assert(best4 === 2, 'Best streak updates to 2', `Expected 2, got ${best4}`);

// -------------------------------------------------------------
// TEST 5: THE USER SCENARIO — Day 2 Missed / Skipped in Middle
// Day 1 (Sep 05) cleared, Day 2 (Sep 06) skipped, Day 3 (Sep 07) cleared
// -------------------------------------------------------------
const historySkippedMiddle: StreakHistoryEntry[] = [
  { date: '2026-09-07', completed: true }, // Cleared Day 3
  { date: '2026-09-05', completed: true }, // Cleared Day 1 (Day 2 / Sep 06 was missed!)
];
const daysClearedUser = historySkippedMiddle.filter(h => h.completed).length;
const streakUser = calculateCurrentStreak(historySkippedMiddle, '2026-09-07', true);
const bestUser = calculateBestStreak(historySkippedMiddle, '2026-09-07', true, 0);

assert(daysClearedUser === 2, 'Total Days Cleared is 2 (lifetime completed days)', `Expected 2, got ${daysClearedUser}`);
assert(streakUser === 1, 'Streak is strictly 1 (NOT 2) because Day 2 was skipped in middle', `Expected 1, got ${streakUser}`);
assert(bestUser === 1, 'Best unbroken streak is 1', `Expected 1, got ${bestUser}`);

// -------------------------------------------------------------
// TEST 6: Missed Yesterday, Today In Progress
// -------------------------------------------------------------
// Day 1 (Sep 05) completed, Day 2 (Sep 06) missed, today is Day 3 (Sep 07) in progress
const historyMissedYesterday: StreakHistoryEntry[] = [
  { date: '2026-09-05', completed: true }
];
const streak6 = calculateCurrentStreak(historyMissedYesterday, '2026-09-07', false);
assert(streak6 === 0, 'Streak is 0 when yesterday was missed and today is not completed yet', `Expected 0, got ${streak6}`);

// -------------------------------------------------------------
// TEST 7: Rest Day (Monarch Aegis) Protects the Streak
// Day 1 (Sep 05) completed, Day 2 (Sep 06) Rest Day, Day 3 (Sep 07) completed
// -------------------------------------------------------------
const historyWithRest: StreakHistoryEntry[] = [
  { date: '2026-09-07', completed: true },
  { date: '2026-09-06', completed: true, isRestDay: true },
  { date: '2026-09-05', completed: true },
];
const streak7 = calculateCurrentStreak(historyWithRest, '2026-09-07', true);
const best7 = calculateBestStreak(historyWithRest, '2026-09-07', true, 0);
assert(streak7 === 3, 'Rest Day preserves and extends unbroken streak to 3', `Expected 3, got ${streak7}`);
assert(best7 === 3, 'Best streak is 3', `Expected 3, got ${best7}`);

// -------------------------------------------------------------
// TEST 8: Long Streak with Reset and New Streak
// Chain 1: 5 days. Then 2 days gap. Chain 2: 2 days.
// -------------------------------------------------------------
const historyMultiChains: StreakHistoryEntry[] = [
  // Chain 2 (Current)
  { date: '2026-09-15', completed: true },
  { date: '2026-09-14', completed: true },
  // Gap on 2026-09-13, 2026-09-12
  // Chain 1 (Old 5-day streak)
  { date: '2026-09-11', completed: true },
  { date: '2026-09-10', completed: true },
  { date: '2026-09-09', completed: true },
  { date: '2026-09-08', completed: true },
  { date: '2026-09-07', completed: true },
];
const streak8 = calculateCurrentStreak(historyMultiChains, '2026-09-15', true);
const best8 = calculateBestStreak(historyMultiChains, '2026-09-15', true, 0);
assert(streak8 === 2, 'Current streak is 2 (current chain)', `Expected 2, got ${streak8}`);
assert(best8 === 5, 'Best streak retains 5 from historical high chain', `Expected 5, got ${best8}`);

// -------------------------------------------------------------
// TEST 9: Unordered / Scrambled History Array Resilience
// -------------------------------------------------------------
const historyScrambled: StreakHistoryEntry[] = [
  { date: '2026-09-03', completed: true },
  { date: '2026-09-05', completed: true },
  { date: '2026-09-01', completed: true },
  { date: '2026-09-04', completed: true },
  { date: '2026-09-02', completed: true },
];
// 5 consecutive days: Sep 01 - Sep 05
const streak9 = calculateCurrentStreak(historyScrambled, '2026-09-05', true);
const best9 = calculateBestStreak(historyScrambled, '2026-09-05', true, 0);
assert(streak9 === 5, 'Unordered history entries correctly calculate 5 streak', `Expected 5, got ${streak9}`);
assert(best9 === 5, 'Unordered history correctly computes 5 best streak', `Expected 5, got ${best9}`);

// -------------------------------------------------------------
// TEST 10: Days Cleared vs Streak Independence
// -------------------------------------------------------------
// Total days completed: 7 non-consecutive days
const historyScattered: StreakHistoryEntry[] = [
  { date: '2026-08-01', completed: true },
  { date: '2026-08-05', completed: true },
  { date: '2026-08-10', completed: true },
  { date: '2026-08-15', completed: true },
  { date: '2026-08-20', completed: true },
  { date: '2026-08-25', completed: true },
  { date: '2026-08-30', completed: true },
];
const totalCleared10 = historyScattered.filter(h => h.completed).length;
const streak10 = calculateCurrentStreak(historyScattered, '2026-09-08', false);
assert(totalCleared10 === 7, 'Days Cleared accumulates lifetime count of 7', `Expected 7, got ${totalCleared10}`);
assert(streak10 === 0, 'Current streak is 0 when separated by gaps', `Expected 0, got ${streak10}`);

console.log('\n================================================================');
console.log(`ALL ${passedTests}/${totalTests} STREAK & DAYS CLEARED TESTS PASSED 100%!`);
console.log('================================================================\n');
