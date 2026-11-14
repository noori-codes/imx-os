/**
 * Client-side daily plan (morning ritual). Keyed by calendar date.
 * Same engagement set: `dashboard/morning-plan.tsx`, `review/evening-shutdown.tsx`,
 * `lib/streak-freezes.ts`, `lib/completion-payoff.ts`, `dashboard/streak-shield.tsx`.
 */

export type DailyPlan = {
  date: string;
  /** Up to 3 task ids chosen as Top 3 */
  topTaskIds: string[];
  /** Habit ids explicitly confirmed for the day */
  habitIds: string[];
  /** Intended focus block length in minutes (optional) */
  focusMinutes: number | null;
  committedAt: string | null;
  dismissedAt: string | null;
};

const KEY_PREFIX = "imx-daily-plan-";

function emptyPlan(date: string): DailyPlan {
  return {
    date,
    topTaskIds: [],
    habitIds: [],
    focusMinutes: null,
    committedAt: null,
    dismissedAt: null,
  };
}

export function dailyPlanStorageKey(date: string) {
  return `${KEY_PREFIX}${date}`;
}

export function readDailyPlan(date: string): DailyPlan {
  if (typeof window === "undefined") return emptyPlan(date);
  try {
    const raw = window.localStorage.getItem(dailyPlanStorageKey(date));
    if (!raw) return emptyPlan(date);
    const parsed = JSON.parse(raw) as Partial<DailyPlan>;
    return {
      date,
      topTaskIds: Array.isArray(parsed.topTaskIds)
        ? parsed.topTaskIds.filter((id): id is string => typeof id === "string").slice(0, 3)
        : [],
      habitIds: Array.isArray(parsed.habitIds)
        ? parsed.habitIds.filter((id): id is string => typeof id === "string")
        : [],
      focusMinutes:
        typeof parsed.focusMinutes === "number" && Number.isFinite(parsed.focusMinutes)
          ? Math.max(0, Math.min(240, Math.round(parsed.focusMinutes)))
          : null,
      committedAt:
        typeof parsed.committedAt === "string" ? parsed.committedAt : null,
      dismissedAt:
        typeof parsed.dismissedAt === "string" ? parsed.dismissedAt : null,
    };
  } catch {
    return emptyPlan(date);
  }
}

export function writeDailyPlan(plan: DailyPlan) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(dailyPlanStorageKey(plan.date), JSON.stringify(plan));
    window.dispatchEvent(
      new CustomEvent("imx:daily-plan-updated", { detail: { date: plan.date } }),
    );
  } catch {
    /* ignore quota */
  }
}

export function isPlanCommitted(plan: DailyPlan) {
  return Boolean(plan.committedAt);
}
