"use client";

import { Play } from "lucide-react";

import {
  buildPickupHint,
  canContinueFocusSession,
  continueSubject,
} from "@/lib/focus-continue";
import { cn } from "@/lib/utils";
import { useFocusTimer } from "@/stores/focus-timer";
import { formatFocusDuration } from "@/types/focus";

function scrollToTimer() {
  document
    .getElementById("focus-timer")
    ?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function FocusContinueBar() {
  const clock = useFocusTimer((s) => s.clock);
  const mode = useFocusTimer((s) => s.mode);
  const elapsedSeconds = useFocusTimer((s) => s.elapsedSeconds);
  const isRunning = useFocusTimer((s) => s.isRunning);
  const sessionStartedAt = useFocusTimer((s) => s.sessionStartedAt);
  const durationSeconds = useFocusTimer((s) => s.durationSeconds);
  const remainingSeconds = useFocusTimer((s) => s.remainingSeconds);
  const progressBaseSeconds = useFocusTimer((s) => s.progressBaseSeconds);
  const intention = useFocusTimer((s) => s.intention);
  const liveElapsedSeconds = useFocusTimer((s) => {
    if (s.clock !== "up") return 0;
    if (!s.isRunning) return s.elapsedSeconds;
    void s.tickMs;
    return s.liveElapsedSeconds();
  });

  const canContinue = canContinueFocusSession({
    clock,
    mode,
    elapsedSeconds,
    isRunning,
    sessionStartedAt,
    durationSeconds,
    remainingSeconds,
    progressBaseSeconds,
  });

  if (!canContinue) return null;

  const stopwatchSession =
    clock === "up" && liveElapsedSeconds > 0 ? liveElapsedSeconds : 0;
  const countdownSession =
    mode === "focus" && durationSeconds > remainingSeconds
      ? durationSeconds - remainingSeconds
      : 0;
  const sessionSeconds = stopwatchSession || countdownSession;
  const subject = continueSubject(intention, null);
  const pickupHint =
    progressBaseSeconds > 0
      ? buildPickupHint(sessionSeconds, subject)
      : subject;

  function handleContinue() {
    useFocusTimer.getState().start();
    scrollToTimer();
  }

  return (
    <div
      className={cn(
        "focus-continue-bar fixed inset-x-0 bottom-0 z-20 lg:hidden",
        "border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
      )}
      style={{
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={handleContinue}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-foreground px-4 py-3 text-left text-background transition-opacity hover:opacity-90 active:opacity-95"
          aria-label={`Continue session · ${formatFocusDuration(sessionSeconds)}`}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background/15">
            <Play className="size-4 fill-current" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">
              Continue · {formatFocusDuration(sessionSeconds)}
            </span>
            {pickupHint ? (
              <span className="mt-0.5 block truncate text-xs text-background/75">
                {pickupHint}
              </span>
            ) : null}
          </span>
        </button>
      </div>
    </div>
  );
}

export function useFocusContinueBarVisible() {
  const clock = useFocusTimer((s) => s.clock);
  const mode = useFocusTimer((s) => s.mode);
  const elapsedSeconds = useFocusTimer((s) => s.elapsedSeconds);
  const isRunning = useFocusTimer((s) => s.isRunning);
  const sessionStartedAt = useFocusTimer((s) => s.sessionStartedAt);
  const durationSeconds = useFocusTimer((s) => s.durationSeconds);
  const remainingSeconds = useFocusTimer((s) => s.remainingSeconds);
  const progressBaseSeconds = useFocusTimer((s) => s.progressBaseSeconds);

  return canContinueFocusSession({
    clock,
    mode,
    elapsedSeconds,
    isRunning,
    sessionStartedAt,
    durationSeconds,
    remainingSeconds,
    progressBaseSeconds,
  });
}
