export type FocusMode = "focus" | "short_break" | "long_break";

export type FocusClock = "down" | "up";

export const FOCUS_CLOCK_KEY = "imx-focus-clock";
export const FOCUS_CLOCK_DEFAULT: FocusClock = "down";

export type FocusSession = {
  id: string;
  user_id: string;
  mode: FocusMode;
  planned_seconds: number;
  actual_seconds: number;
  completed: boolean;
  note: string | null;
  task_id: string | null;
  task_title: string | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
};

export type FocusWeekDay = {
  date: string;
  minutes: number;
  level: 0 | 1 | 2 | 3 | 4;
};

export type FocusTodayMark = {
  started_at: string;
  minutes: number;
};

export type FocusOverviewStats = {
  sessions: number;
  focus_minutes: number;
  current_streak: number;
  longest_streak: number;
  week: FocusWeekDay[];
  today_marks: FocusTodayMark[];
};

export const FOCUS_DAILY_GOAL_PRESETS = [
  { label: "1h", minutes: 60 },
  { label: "2h", minutes: 120 },
  { label: "3h", minutes: 180 },
  { label: "4h", minutes: 240 },
] as const;

export const FOCUS_DAILY_GOAL_DEFAULT = 120;
export const FOCUS_DAILY_GOAL_KEY = "imx-focus-daily-goal";

export type FocusProfileId = "classic" | "deep" | "quick";

export const FOCUS_PROFILES = [
  {
    id: "classic",
    label: "Classic",
    hint: "25 · 5 · 15",
    focus: 25,
    short_break: 5,
    long_break: 15,
  },
  {
    id: "deep",
    label: "Deep",
    hint: "50 · 10 · 20",
    focus: 50,
    short_break: 10,
    long_break: 20,
  },
  {
    id: "quick",
    label: "Quick",
    hint: "15 · 3 · 10",
    focus: 15,
    short_break: 3,
    long_break: 10,
  },
] as const satisfies ReadonlyArray<{
  id: FocusProfileId;
  label: string;
  hint: string;
  focus: number;
  short_break: number;
  long_break: number;
}>;

export const FOCUS_PROFILE_KEY = "imx-focus-profile";
export const FOCUS_PROFILE_DEFAULT: FocusProfileId = "classic";

export function getFocusProfile(id: FocusProfileId) {
  return FOCUS_PROFILES.find((profile) => profile.id === id) ?? FOCUS_PROFILES[0];
}

export function matchFocusProfile(durations: {
  focus: number;
  short_break: number;
  long_break: number;
}): FocusProfileId | null {
  const match = FOCUS_PROFILES.find(
    (profile) =>
      profile.focus === durations.focus &&
      profile.short_break === durations.short_break &&
      profile.long_break === durations.long_break,
  );
  return match?.id ?? null;
}

export const FOCUS_PRESETS: Record<
  FocusMode,
  { label: string; minutes: number }
> = {
  focus: { label: "Focus", minutes: 25 },
  short_break: { label: "Short break", minutes: 5 },
  long_break: { label: "Long break", minutes: 15 },
};

export const FOCUS_DURATION_PRESETS = [
  { label: "25m", minutes: 25 },
  { label: "50m", minutes: 50 },
  { label: "90m", minutes: 90 },
  { label: "2h", minutes: 120 },
  { label: "3h", minutes: 180 },
] as const;

export const BREAK_DURATION_PRESETS: Record<
  Exclude<FocusMode, "focus">,
  readonly { label: string; minutes: number }[]
> = {
  short_break: [
    { label: "5m", minutes: 5 },
    { label: "10m", minutes: 10 },
    { label: "15m", minutes: 15 },
  ],
  long_break: [
    { label: "15m", minutes: 15 },
    { label: "20m", minutes: 20 },
    { label: "30m", minutes: 30 },
  ],
};

export const FOCUS_POMODOROS_PER_LONG_BREAK = 4;

export const FOCUS_MAX_SECONDS = 12 * 60 * 60;

export function formatFocusClock(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatFocusDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    if (m === 0 && s === 0) return `${h}h`;
    if (s === 0) return `${h}h ${m}m`;
    return `${h}h ${m}m`;
  }
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

export function formatFocusMinutes(totalMinutes: number) {
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
