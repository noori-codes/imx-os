import type { FocusClock, FocusMode } from "@/types/focus";
import { formatFocusDuration } from "@/types/focus";

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
