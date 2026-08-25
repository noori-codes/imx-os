"use client";

import confetti from "canvas-confetti";

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

function readThemeColors() {
  if (typeof window === "undefined") {
    return ["#18181b", "#71717a", "#a1a1aa", "#d4d4d8"];
  }
  const dark = document.documentElement.classList.contains("dark");
  return dark
    ? ["#fafafa", "#a1a1aa", "#71717a", "#3f3f46"]
    : ["#18181b", "#52525b", "#a1a1aa", "#d4d4d8"];
}

export function fireFocusGoalConfetti() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const colors = readThemeColors();
  const base = {
    colors,
    disableForReducedMotion: true as const,
    scalar: 0.9,
    ticks: 220,
  };

  void confetti({
    ...base,
    particleCount: 55,
    spread: 62,
    startVelocity: 32,
    origin: { x: 0.5, y: 0.62 },
  });

  window.setTimeout(() => {
    void confetti({
      ...base,
      particleCount: 28,
      angle: 60,
      spread: 48,
      origin: { x: 0.12, y: 0.72 },
    });
    void confetti({
      ...base,
      particleCount: 28,
      angle: 120,
      spread: 48,
      origin: { x: 0.88, y: 0.72 },
    });
  }, 160);
}

/**
 * On finish/seal: use the user's chosen daily goal + today's total after this
 * session. Congrats once per day when today >= goal; otherwise nothing.
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
