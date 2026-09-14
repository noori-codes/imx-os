import type { TaskView } from "@/types/task";
import {
  FOCUS_CLOCK_DEFAULT,
  FOCUS_CLOCK_KEY,
  FOCUS_PROFILE_DEFAULT,
  FOCUS_PROFILE_KEY,
  type FocusClock,
  type FocusProfileId,
} from "@/types/focus";

/** Device prefs (localStorage / cookie). Server goal lives in user_settings. */
export const PREF_AUTO_START = "imx-focus-auto-start";
export const PREF_CHIME = "imx-focus-chime";
export const PREF_CELEBRATE = "imx-focus-celebrate";
export const PREF_TASKS_VIEW = "imx-tasks-default-view";
export const PREF_TASKS_VIEW_COOKIE = "imx-tasks-default-view";

export function readBoolPref(key: string, fallback = true): boolean {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw == null) return fallback;
  return raw === "1" || raw === "true";
}

export function writeBoolPref(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value ? "1" : "0");
}

export function readFocusClockPref(): FocusClock {
  if (typeof window === "undefined") return FOCUS_CLOCK_DEFAULT;
  const raw = window.localStorage.getItem(FOCUS_CLOCK_KEY);
  return raw === "up" || raw === "down" ? raw : FOCUS_CLOCK_DEFAULT;
}

export function writeFocusClockPref(clock: FocusClock) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FOCUS_CLOCK_KEY, clock);
}

export function readFocusProfilePref(): FocusProfileId {
  if (typeof window === "undefined") return FOCUS_PROFILE_DEFAULT;
  const raw = window.localStorage.getItem(FOCUS_PROFILE_KEY);
  if (raw === "classic" || raw === "deep" || raw === "quick") return raw;
  return FOCUS_PROFILE_DEFAULT;
}

export function writeFocusProfilePref(id: FocusProfileId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FOCUS_PROFILE_KEY, id);
}

export function readDefaultTaskView(): TaskView {
  if (typeof window === "undefined") return "today";
  const raw = window.localStorage.getItem(PREF_TASKS_VIEW);
  if (
    raw === "today" ||
    raw === "week" ||
    raw === "inbox" ||
    raw === "upcoming" ||
    raw === "all"
  ) {
    return raw;
  }
  return "today";
}

export function writeDefaultTaskView(view: TaskView) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREF_TASKS_VIEW, view);
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${PREF_TASKS_VIEW_COOKIE}=${view}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function parseDefaultTaskViewCookie(
  value: string | undefined | null,
): TaskView | null {
  if (
    value === "today" ||
    value === "week" ||
    value === "inbox" ||
    value === "upcoming" ||
    value === "all"
  ) {
    return value;
  }
  return null;
}
