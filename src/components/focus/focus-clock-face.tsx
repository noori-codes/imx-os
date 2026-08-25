"use client";

import { cn } from "@/lib/utils";
import { useFocusTimer } from "@/stores/focus-timer";
import {
  FOCUS_PRESETS,
  formatFocusClock,
  formatFocusMinutes,
  type FocusMode,
} from "@/types/focus";

type FocusClockFaceProps = {
  isRunning: boolean;
  isStopwatch: boolean;
  canContinue: boolean;
  mode: FocusMode;
  durationSeconds: number;
  subject: string | null;
  sessionLine: string | null;
  pickupHint: string | null;
  endedHint: string | null;
  runningHint: string | null;
  upcomingLabel: string;
  ringRadius: number;
  ringCircumference: number;
};

/** Only this subtree subscribes to the 1 Hz tick — keeps FocusTimer calm. */
export function FocusClockFace({
  isRunning,
  isStopwatch,
  canContinue,
  mode,
  durationSeconds,
  subject,
  sessionLine,
  pickupHint,
  endedHint,
  runningHint,
  upcomingLabel,
  ringRadius,
  ringCircumference,
}: FocusClockFaceProps) {
  const shownSeconds = useFocusTimer((s) => {
    void s.tickMs;
    void s.lastDisplaySecond;
    void s.remainingSeconds;
    void s.elapsedSeconds;
    return s.displaySeconds();
  });

  const progress =
    !isStopwatch && durationSeconds > 0
      ? ((durationSeconds - shownSeconds) / durationSeconds) * 100
      : 0;

  return (
    <>
      <svg
        className="absolute inset-0 size-full -rotate-90"
        viewBox="0 0 100 100"
        aria-hidden
      >
        <circle
          cx="50"
          cy="50"
          r={ringRadius}
          fill="none"
          className="stroke-muted/50"
          strokeWidth="1"
        />
        <circle
          cx="50"
          cy="50"
          r={ringRadius}
          fill="none"
          className="stroke-muted/80"
          strokeWidth="2.75"
          strokeDasharray="1.2 2.4"
          opacity={0.35}
        />
        {!isStopwatch ? (
          <circle
            cx="50"
            cy="50"
            r={ringRadius}
            fill="none"
            className="stroke-foreground transition-[stroke-dashoffset] duration-500 ease-linear"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeDasharray={ringCircumference}
            strokeDashoffset={ringCircumference * (1 - progress / 100)}
          />
        ) : null}
      </svg>

      <div className="relative px-8 text-center">
        <p
          className={cn(
            "focus-clock text-foreground",
            shownSeconds >= 3600
              ? "text-[clamp(2.25rem,6.5vw,3.75rem)]"
              : "text-[clamp(2.75rem,8vw,4.75rem)]",
          )}
        >
          {formatFocusClock(shownSeconds)}
        </p>
        <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {isStopwatch
            ? "Count up · Open"
            : `Countdown · ${formatFocusMinutes(Math.round(durationSeconds / 60))} ${FOCUS_PRESETS[mode].label}`}
        </p>
        {isRunning ? (
          <div className="mt-4 space-y-1">
            <p className="mx-auto max-w-[14rem] truncate text-sm text-foreground/85">
              {isStopwatch
                ? subject ?? "Focus"
                : mode === "focus"
                  ? "Deep work"
                  : FOCUS_PRESETS[mode].label}
              {sessionLine ? ` · ${sessionLine}` : ""}
            </p>
            {pickupHint && isRunning ? (
              <p className="text-xs text-muted-foreground">{pickupHint}</p>
            ) : endedHint ? (
              <p className="text-xs text-muted-foreground">{endedHint}</p>
            ) : runningHint ? (
              <p className="text-xs text-muted-foreground">{runningHint}</p>
            ) : isStopwatch ? null : (
              <p className="text-xs text-muted-foreground">
                Up next: {upcomingLabel}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm tabular-nums text-muted-foreground">
            {isStopwatch
              ? canContinue
                ? pickupHint ?? `Paused · ${formatFocusClock(shownSeconds)}`
                : shownSeconds > 0
                  ? `Paused · ${formatFocusClock(shownSeconds)}`
                  : "Count up · 00:00"
              : canContinue
                ? `Paused · ${formatFocusClock(durationSeconds - shownSeconds)}`
                : `${FOCUS_PRESETS[mode].label} · ${formatFocusClock(durationSeconds)}`}
          </p>
        )}
      </div>
    </>
  );
}
