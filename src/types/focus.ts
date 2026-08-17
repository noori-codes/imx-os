export type FocusMode = "focus" | "short_break" | "long_break";

export type FocusSession = {
  id: string;
  user_id: string;
  mode: FocusMode;
  planned_seconds: number;
  actual_seconds: number;
  completed: boolean;
  note: string | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
};

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
