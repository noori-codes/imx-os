import type { FocusClock, FocusMode, FocusSession } from "@/types/focus";
import { formatFocusDuration } from "@/types/focus";
import { isToday, toDateString } from "@/lib/date-utils";

type SessionSnapshot = {
  clock: FocusClock;
  mode: FocusMode;
  elapsedSeconds: number;
  isRunning: boolean;
  sessionStartedAt: number | null;
  durationSeconds: number;
  remainingSeconds: number;
  progressBaseSeconds: number;
};

export function sessionInProgress(state: SessionSnapshot): boolean {
  if (state.clock === "up") {
    return state.elapsedSeconds > 0 || state.isRunning;
  }
  if (state.mode !== "focus") return state.isRunning;
  if (state.isRunning) return true;
  return state.durationSeconds > state.remainingSeconds;
}

export function canContinueFocusSession(state: SessionSnapshot): boolean {
  return !state.isRunning && sessionInProgress(state);
}

export function continueSubject(
  intention: string | null | undefined,
  taskTitle: string | null | undefined,
): string | null {
  const trimmed = intention?.trim();
  if (trimmed) return trimmed;
  if (taskTitle?.trim()) return taskTitle.trim();
  return null;
}

export function buildPickupHint(
  seconds: number,
  subject: string | null,
): string {
  const time = formatFocusDuration(seconds);
  return subject
    ? `Picking up from ${time} · ${subject}`
    : `Picking up from ${time}`;
}

export function canContinueLoggedSession(
  session: Pick<FocusSession, "mode" | "actual_seconds" | "started_at">,
  isRunning: boolean,
): boolean {
  if (isRunning) return false;
  if (session.mode !== "focus") return false;
  if (session.actual_seconds <= 0) return false;
  return isToday(toDateString(new Date(session.started_at)));
}
