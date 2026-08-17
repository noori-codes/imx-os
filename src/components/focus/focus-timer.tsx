"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { logFocusSession } from "@/actions/focus";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { playDefaultFocusSound, stopFocusSound } from "@/stores/focus-sound";
import { useFocusTimer } from "@/stores/focus-timer";
import {
  FOCUS_DURATION_PRESETS,
  FOCUS_MAX_SECONDS,
  FOCUS_PRESETS,
  formatFocusClock,
  type FocusMode,
} from "@/types/focus";

const MODES: FocusMode[] = ["focus", "short_break", "long_break"];

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  if (target.closest("button, a, [role='button']")) return true;
  return false;
}

export function FocusTimer() {
  const {
    mode,
    durationSeconds,
    remainingSeconds,
    isRunning,
    setMode,
    setDuration,
    start,
    pause,
    reset,
    tick,
  } = useFocusTimer();

  const [, startTransition] = useTransition();
  const loggedRef = useRef(false);
  const prevRemaining = useRef(remainingSeconds);
  const [customHours, setCustomHours] = useState("");
  const [customMinutes, setCustomMinutes] = useState("");

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => tick(), 1000);
    return () => window.clearInterval(id);
  }, [isRunning, tick]);

  useEffect(() => {
    if (
      remainingSeconds === 0 &&
      prevRemaining.current > 0 &&
      !loggedRef.current
    ) {
      loggedRef.current = true;
      const planned = durationSeconds;
      const currentMode = mode;
      startTransition(async () => {
        await logFocusSession({
          mode: currentMode,
          planned_seconds: planned,
          actual_seconds: planned,
          completed: true,
        });
        stopFocusSound();
        reset();
      });
    }
    prevRemaining.current = remainingSeconds;
  }, [remainingSeconds, mode, durationSeconds, reset]);

  useEffect(() => {
    if (remainingSeconds > 0) {
      loggedRef.current = false;
    }
  }, [remainingSeconds, mode]);

  const durationMinutes = Math.round(durationSeconds / 60);
  const presetMatch = FOCUS_DURATION_PRESETS.some(
    (preset) => preset.minutes === durationMinutes,
  );

  function secondsFromCustom() {
    const hours = Number(customHours || 0);
    const minutes = Number(customMinutes || 0);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    const seconds = Math.round(hours * 3600 + minutes * 60);
    if (seconds < 60 || seconds > FOCUS_MAX_SECONDS) return null;
    return seconds;
  }

  function handleStart() {
    const custom = secondsFromCustom();
    start(custom ?? undefined);
    if (mode === "focus") playDefaultFocusSound();
  }

  function handlePause() {
    pause();
    stopFocusSound();
  }

  function handleToggle() {
    if (isRunning) {
      handlePause();
      return;
    }
    handleStart();
  }

  function handleReset() {
    stopFocusSound();
    if (remainingSeconds >= durationSeconds || remainingSeconds === 0) {
      reset();
      return;
    }

    const actual = durationSeconds - remainingSeconds;
    const currentMode = mode;
    const planned = durationSeconds;
    startTransition(async () => {
      if (actual >= 5) {
        await logFocusSession({
          mode: currentMode,
          planned_seconds: planned,
          actual_seconds: actual,
          completed: false,
        });
      }
      reset();
    });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;

      if (e.code === "Space") {
        e.preventDefault();
        handleToggle();
        return;
      }

      if ((e.key === "r" || e.key === "R") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleReset();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const progress =
    durationSeconds > 0
      ? ((durationSeconds - remainingSeconds) / durationSeconds) * 100
      : 0;

  return (
    <section className="flex flex-col items-center rounded-3xl border bg-card px-5 py-8 sm:px-10 sm:py-10">
      <div
        className="inline-flex rounded-full bg-muted p-1"
        role="tablist"
        aria-label="Timer mode"
      >
        {MODES.map((m) => {
          const isActive = mode === m;
          return (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={isRunning}
              onClick={() => {
                if (isRunning) return;
                setMode(m);
              }}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm transition-colors disabled:opacity-50",
                isActive
                  ? "bg-background font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {FOCUS_PRESETS[m].label}
            </button>
          );
        })}
      </div>

      <div className="relative mx-auto mt-10 flex size-64 items-center justify-center sm:size-72">
        <svg
          className="absolute inset-0 size-full -rotate-90"
          viewBox="0 0 100 100"
          aria-hidden
        >
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            className="stroke-muted"
            strokeWidth="3"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            className="stroke-foreground transition-[stroke-dashoffset] duration-1000 ease-linear"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 44}`}
            strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
          />
        </svg>
        <div className="relative text-center">
          <p
            className={cn(
              "font-mono font-semibold tracking-tight tabular-nums",
              remainingSeconds >= 3600 ? "text-4xl sm:text-5xl" : "text-5xl sm:text-6xl",
            )}
          >
            {formatFocusClock(remainingSeconds)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {isRunning ? "In session" : FOCUS_PRESETS[mode].label}
          </p>
        </div>
      </div>

      {mode === "focus" && !isRunning ? (
        <div className="mt-8 flex w-full max-w-md flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {FOCUS_DURATION_PRESETS.map((preset) => {
              const active =
                !customHours &&
                !customMinutes &&
                durationMinutes === preset.minutes;
              return (
                <button
                  key={preset.minutes}
                  type="button"
                  onClick={() => {
                    setCustomHours("");
                    setCustomMinutes("");
                    setDuration(preset.minutes * 60);
                  }}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-sm tabular-nums transition-colors",
                    active
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Input
              type="number"
              min={0}
              max={12}
              inputMode="numeric"
              placeholder="hrs"
              aria-label="Custom hours"
              value={customHours}
              onChange={(e) => setCustomHours(e.target.value)}
              className="h-9 w-16 rounded-full border-0 bg-muted text-center shadow-none"
            />
            <span className="text-muted-foreground">:</span>
            <Input
              type="number"
              min={0}
              max={59}
              inputMode="numeric"
              placeholder="min"
              aria-label="Custom minutes"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="h-9 w-16 rounded-full border-0 bg-muted text-center shadow-none"
            />
            {!presetMatch && !customHours && !customMinutes ? (
              <span className="text-xs tabular-nums text-muted-foreground">
                {formatFocusClock(durationSeconds)}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-10 flex items-center gap-4">
        <button
          type="button"
          onClick={handleReset}
          className="flex size-12 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Reset timer"
        >
          <RotateCcw className="size-5" />
        </button>
        <button
          type="button"
          onClick={handleToggle}
          className="flex size-16 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-[1.03] active:scale-95"
          aria-label={isRunning ? "Pause timer" : "Start timer"}
        >
          {isRunning ? (
            <Pause className="size-6 fill-current" />
          ) : (
            <Play className="size-6 fill-current pl-0.5" />
          )}
        </button>
        <span className="size-12" aria-hidden />
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Space to {isRunning ? "pause" : "start"} · R to reset
      </p>
    </section>
  );
}
