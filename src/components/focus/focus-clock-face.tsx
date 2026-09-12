"use client";

import { cn } from "@/lib/utils";
import { useFocusTimer } from "@/stores/focus-timer";
import {
  FOCUS_PRESETS,
  formatFocusClock,
  formatFocusMinutes,
  type FocusMode,
} from "@/types/focus";

const CLOCK_TICKS = Array.from({ length: 12 }, (_, i) => {
  const rad = ((i * 30 - 90) * Math.PI) / 180;
  const outer = 48.4;
  const inner = i % 3 === 0 ? 45.1 : 46.6;
  return {
    i,
    major: i % 3 === 0,
    x1: 50 + Math.cos(rad) * inner,
    y1: 50 + Math.sin(rad) * inner,
    x2: 50 + Math.cos(rad) * outer,
    y2: 50 + Math.sin(rad) * outer,
  };
});

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
  /** Hide secondary hints when the side panel already shows them. */
  compactHints?: boolean;
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
  compactHints = false,
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
        className="absolute inset-0 size-full overflow-visible"
        viewBox="0 0 100 100"
        aria-hidden
      >
        {isRunning ? (
          <>
            <circle
              cx="50"
              cy="50"
              r="38.5"
              fill="none"
              className="focus-clock-core"
            />
            <circle
              cx="50"
              cy="50"
              r="48.8"
              fill="none"
              className="focus-clock-orbit"
            />
            {CLOCK_TICKS.map((tick) => (
              <line
                key={tick.i}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                className={
                  tick.major ? "focus-clock-tick-major" : "focus-clock-tick"
                }
              />
            ))}
          </>
        ) : null}
        <circle
          cx="50"
          cy="50"
          r={ringRadius}
          fill="none"
          className="stroke-muted/50"
          strokeWidth="1"
        />
        <g transform="rotate(-90 50 50)">
          <circle
            cx="50"
            cy="50"
            r={ringRadius}
            fill="none"
            className="focus-clock-halo"
            strokeWidth={isRunning ? 2.2 : 2.75}
            strokeDasharray="1.2 2.4"
            opacity={0.35}
          />
          {!isStopwatch ? (
            <circle
              cx="50"
              cy="50"
              r={ringRadius}
              fill="none"
              className="focus-clock-progress"
              strokeWidth={isRunning ? 2.35 : 2.75}
              strokeLinecap="round"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringCircumference * (1 - progress / 100)}
            />
          ) : null}
        </g>
      </svg>

      <div className="relative px-8 text-center">
        <p
          className={cn(
            "focus-clock text-foreground",
            isRunning && "focus-clock-live",
            shownSeconds >= 3600
              ? isRunning
                ? "text-[clamp(2.5rem,7vw,4.35rem)]"
                : "text-[clamp(2.25rem,6.5vw,3.75rem)]"
              : isRunning
                ? "text-[clamp(3.15rem,9.5vw,5.65rem)]"
                : "text-[clamp(2.75rem,8vw,4.75rem)]",
          )}
        >
          {formatFocusClock(shownSeconds)}
        </p>
        {compactHints && isRunning ? null : (
          <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {isStopwatch
              ? "Count up · Open"
              : `Countdown · ${formatFocusMinutes(Math.round(durationSeconds / 60))} ${FOCUS_PRESETS[mode].label}`}
          </p>
        )}
        {compactHints ? null : isRunning ? (
          <div className="mt-4 space-y-1">
            <p className="mx-auto max-w-56 truncate text-sm text-foreground/85">
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
