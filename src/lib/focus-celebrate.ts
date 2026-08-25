"use client";

import { showFocusSealToast } from "@/components/focus/focus-seal-toast";
import { toDateString } from "@/lib/date-utils";
import {
  clampDailyFocusGoal,
  FOCUS_DAILY_GOAL_DEFAULT,
  FOCUS_DAILY_GOAL_KEY,
} from "@/types/focus";

const CELEBRATED_KEY_PREFIX = "imx-focus-goal-celebrated-";

function celebratedStorageKey(day = new Date()) {
  return `${CELEBRATED_KEY_PREFIX}${toDateString(day)}`;
}

export function hasCelebratedDailyGoalToday() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(celebratedStorageKey()) === "1";
}

function markDailyGoalCelebratedToday() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(celebratedStorageKey(), "1");
}

/** Live goal from the sky rail (localStorage), falling back to server prop. */
export function readFocusDailyGoalMinutes(fallback = FOCUS_DAILY_GOAL_DEFAULT) {
  if (typeof window === "undefined") return clampDailyFocusGoal(fallback);
  const raw = window.localStorage.getItem(FOCUS_DAILY_GOAL_KEY);
  if (raw == null) return clampDailyFocusGoal(fallback);
  const value = Number(raw);
  if (!Number.isFinite(value)) return clampDailyFocusGoal(fallback);
  return clampDailyFocusGoal(value);
}

type ConfettiFn = (options?: Record<string, unknown>) => Promise<null> | null;

async function loadConfetti(): Promise<ConfettiFn | null> {
  try {
    const mod = await import("canvas-confetti");
    const candidate = (mod as { default?: unknown }).default ?? mod;
    if (typeof candidate === "function") return candidate as ConfettiFn;
    console.error("[focus] canvas-confetti export is not a function", mod);
    return null;
  } catch (error) {
    console.error("[focus] failed to load canvas-confetti", error);
    return null;
  }
}

function themeColors() {
  const dark = document.documentElement.classList.contains("dark");
  return dark
    ? ["#fafafa", "#a1a1aa", "#71717a", "#52525b"]
    : ["#18181b", "#3f3f46", "#71717a", "#a1a1aa"];
}

/** Always try to fire — used on every focus finish/seal. */
export function fireFocusGoalConfetti() {
  if (typeof window === "undefined") return;

  void (async () => {
    const confetti = await loadConfetti();
    if (!confetti) return;

    const colors = themeColors();
    const base = {
      colors,
      zIndex: 2147483647,
      disableForReducedMotion: false,
      scalar: 1,
      ticks: 280,
    };

    try {
      await confetti({
        ...base,
        particleCount: 120,
        spread: 86,
        startVelocity: 45,
        origin: { x: 0.5, y: 0.55 },
      });
      await confetti({
        ...base,
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0.1, y: 0.7 },
      });
      await confetti({
        ...base,
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 0.9, y: 0.7 },
      });
    } catch (error) {
      console.error("[focus] confetti failed", error);
    }
  })();
}

/**
 * On finish/seal: use the user's chosen daily goal + today's total after this
 * session. Congrats toast once per day when today >= goal.
 */
export function celebrateDailyGoalIfCrossed({
  afterMinutes,
  goalMinutes,
  onMarkDone,
}: {
  beforeMinutes?: number;
  afterMinutes: number;
  goalMinutes: number;
  onMarkDone?: () => void;
}) {
  if (goalMinutes <= 0) return false;
  if (afterMinutes < goalMinutes) return false;
  if (hasCelebratedDailyGoalToday()) return false;

  markDailyGoalCelebratedToday();
  fireFocusGoalConfetti();
  showFocusSealToast({
    kind: "goal",
    title: "Daily goal sealed",
    todayMinutes: afterMinutes,
    goalMinutes,
    onMarkDone,
  });
  return true;
}
