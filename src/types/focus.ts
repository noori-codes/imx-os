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
