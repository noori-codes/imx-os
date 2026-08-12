"use client";

import { useEffect, useRef, useTransition } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { logFocusSession } from "@/actions/focus";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFocusTimer } from "@/stores/focus-timer";
import { FOCUS_PRESETS, type FocusMode } from "@/types/focus";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const MODES: FocusMode[] = ["focus", "short_break", "long_break"];

export function FocusTimer() {
  const {
    mode,
    durationSeconds,
    remainingSeconds,
    isRunning,
    completedFocusCount,
    setMode,
    start,
    pause,
    reset,
    tick,
  } = useFocusTimer();

  const [pending, startTransition] = useTransition();
  const loggedRef = useRef(false);
  const prevRemaining = useRef(remainingSeconds);

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => tick(), 1000);
    return () => window.clearInterval(id);
  }, [isRunning, tick]);

  // Log when timer hits 0
  useEffect(() => {
    if (
      remainingSeconds === 0 &&
      prevRemaining.current > 0 &&
      !loggedRef.current
    ) {
      loggedRef.current = true;
      startTransition(async () => {
        await logFocusSession({
          mode,
          planned_seconds: durationSeconds,
          actual_seconds: durationSeconds,
          completed: true,
        });
      });
    }
    prevRemaining.current = remainingSeconds;
  }, [remainingSeconds, mode, durationSeconds]);

  // Reset log guard when timer resets / mode changes
  useEffect(() => {
    if (remainingSeconds > 0) {
      loggedRef.current = false;
    }
  }, [remainingSeconds, mode]);

  const progress =
    durationSeconds > 0
      ? ((durationSeconds - remainingSeconds) / durationSeconds) * 100
      : 0;

  const handleModeChange = (next: FocusMode) => {
    if (isRunning) return;
    setMode(next);
  };

  const handleSkipLog = () => {
    if (remainingSeconds >= durationSeconds) {
      reset();
      return;
    }

    const actual = durationSeconds - remainingSeconds;
    startTransition(async () => {
      if (actual >= 5) {
        await logFocusSession({
          mode,
          planned_seconds: durationSeconds,
          actual_seconds: actual,
          completed: false,
        });
      }
      reset();
    });
  };

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap justify-center gap-2">
        {MODES.map((m) => (
          <Button
            key={m}
            type="button"
            size="sm"
            variant={mode === m ? "default" : "outline"}
            disabled={isRunning}
            onClick={() => handleModeChange(m)}
          >
            {FOCUS_PRESETS[m].label}
          </Button>
        ))}
      </div>

      <div className="relative mx-auto mt-8 flex size-56 items-center justify-center">
        <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            className="stroke-muted"
            strokeWidth="4"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            className="stroke-primary transition-[stroke-dashoffset] duration-1000 ease-linear"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
          />
        </svg>
        <div className="relative text-center">
          <p
            className={cn(
              "font-mono text-5xl font-semibold tracking-tight tabular-nums",
              remainingSeconds === 0 && "text-primary",
            )}
          >
            {formatTime(remainingSeconds)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {FOCUS_PRESETS[mode].label}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        {isRunning ? (
          <Button type="button" size="lg" onClick={pause}>
            <Pause className="size-4" />
            Pause
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            onClick={start}
            disabled={remainingSeconds === 0 || pending}
          >
            <Play className="size-4" />
            {remainingSeconds === durationSeconds ? "Start" : "Resume"}
          </Button>
        )}

        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={handleSkipLog}
          disabled={pending || (remainingSeconds === durationSeconds && !isRunning)}
        >
          <RotateCcw className="size-4" />
          Reset
        </Button>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Focus sessions completed this page visit: {completedFocusCount}
        {pending ? " · Saving…" : null}
      </p>
    </div>
  );
}
