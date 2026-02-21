import type { DayStatus } from "../types";

// ── Internal helpers ──────────────────────────────────────────────────────────

function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateToKey(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Counts consecutive "success" days going backward from today.
 * Any day that is not "success" (fail, empty, or missing key) breaks the streak.
 */
export function calcCurrentStreak(statuses: Record<string, DayStatus>): number {
  const cursor = todayMidnight();
  let streak = 0;

  while (true) {
    const key = dateToKey(cursor);
    if (statuses[key] !== "success") break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/**
 * Finds the longest consecutive "success" streak across all recorded history
 * up to and including today.
 */
export function calcLongestStreak(statuses: Record<string, DayStatus>): number {
  const keys = Object.keys(statuses).sort();
  if (keys.length === 0) return 0;

  const today = todayMidnight();
  const cursor = new Date(keys[0]); // earliest recorded date
  let longest = 0;
  let current = 0;

  while (cursor <= today) {
    const key = dateToKey(cursor);
    if (statuses[key] === "success") {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 0;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return longest;
}

export interface MonthStats {
  successes: number;
  fails: number;
}

/**
 * Counts successes and fails recorded for a given year/month (month is 0-indexed).
 */
export function calcMonthStats(
  statuses: Record<string, DayStatus>,
  year: number,
  month: number,
): MonthStats {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  let successes = 0;
  let fails = 0;

  for (const [key, status] of Object.entries(statuses)) {
    if (key.startsWith(prefix)) {
      if (status === "success") successes++;
      else if (status === "fail") fails++;
    }
  }

  return { successes, fails };
}

export interface YearStats {
  successes: number;
  fails: number;
}

/**
 * Counts successes and fails recorded for a given year.
 */
export function calcYearStats(
  statuses: Record<string, DayStatus>,
  year: number,
): YearStats {
  const prefix = `${year}-`;
  let successes = 0;
  let fails = 0;

  for (const [key, status] of Object.entries(statuses)) {
    if (key.startsWith(prefix)) {
      if (status === "success") successes++;
      else if (status === "fail") fails++;
    }
  }

  return { successes, fails };
}
