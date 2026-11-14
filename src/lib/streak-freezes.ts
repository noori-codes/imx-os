import { addDaysToDateString, computeStreaks } from "@/lib/date-utils";

/** Fair streaks — pairs with `dashboard/streak-shield.tsx` + settings freezes column. */

const FREEZE_DATES_KEY = "imx-streak-freeze-dates-v1";
const FREEZE_WEEK_KEY = "imx-streak-freeze-week-v1";

function readFreezeDates(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FREEZE_DATES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d));
  } catch {
    return [];
  }
}

function writeFreezeDates(dates: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FREEZE_DATES_KEY, JSON.stringify([...new Set(dates)].sort()));
  } catch {
    /* ignore */
  }
}

/** ISO week id YYYY-Www for weekly freeze refill tracking. */
export function isoWeekId(date = new Date()) {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function listStreakFreezeDates() {
  return readFreezeDates();
}

export function hasStreakFreezeOn(date: string) {
  return readFreezeDates().includes(date);
}

/** Record a freeze day locally (bridge gap in activity streak). */
export function recordStreakFreezeDate(date: string) {
  const next = [...readFreezeDates(), date];
  writeFreezeDates(next);
  window.dispatchEvent(
    new CustomEvent("imx:streak-freeze-updated", { detail: { date } }),
  );
}

/**
 * Activity dates + freeze dates for streak continuity.
 * Freezes count as "present" so a one-day skip does not zero the streak.
 */
export function computeActivityStreakWithFreezes(
  activeDates: string[],
  today: string,
  freezeDates: string[] = readFreezeDates(),
) {
  const merged = [...new Set([...activeDates, ...freezeDates])];
  return computeStreaks(merged, today);
}

/** True when yesterday had no activity and today is still quiet — streak at risk. */
export function streakAtRisk(
  activeDates: string[],
  today: string,
  freezeDates: string[] = readFreezeDates(),
) {
  const yesterday = addDaysToDateString(today, -1);
  const set = new Set([...activeDates, ...freezeDates]);
  if (set.has(today) || set.has(yesterday)) return false;
  // Had something the day before yesterday → gap opened yesterday
  const dayBefore = addDaysToDateString(today, -2);
  return set.has(dayBefore);
}

/**
 * Once per ISO week, suggest refilling freezes to at least 1.
 * Returns the suggested remaining count, or null if no refill needed.
 */
export function suggestWeeklyFreezeRefill(currentRemaining: number) {
  if (typeof window === "undefined") return null;
  if (currentRemaining >= 1) return null;
  const week = isoWeekId();
  try {
    const last = window.localStorage.getItem(FREEZE_WEEK_KEY);
    if (last === week) return null;
    return 1;
  } catch {
    return null;
  }
}

export function markWeeklyFreezeRefillApplied() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FREEZE_WEEK_KEY, isoWeekId());
  } catch {
    /* ignore */
  }
}
