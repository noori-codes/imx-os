"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { logFocusSession } from "@/actions/focus";
import { FocusSounds } from "@/components/focus/focus-sounds";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { playDefaultFocusSound } from "@/stores/focus-sound";
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

  function handleToggle() {
    if (isRunning) {
      pause();
      return;
    }
    handleStart();
  }

  function handleReset() {
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
    <section className="flex flex-col items-center">
      <nav
        className="flex gap-1 border-b border-border/60"
        aria-label="Timer mode"
      >
        {MODES.map((m) => {
          const isActive = mode === m;
          return (
            <button
              key={m}
              type="button"
              disabled={isRunning}
              onClick={() => {
                if (isRunning) return;
                setMode(m);
              }}
              className={cn(
                "relative shrink-0 px-3 py-2.5 text-sm transition-colors disabled:opacity-50",
                isActive
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-current={isActive ? "true" : undefined}
            >
              {FOCUS_PRESETS[m].label}
              {isActive ? (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-foreground" />
              ) : null}
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={handleToggle}
        className="relative mx-auto mt-10 flex size-52 items-center justify-center rounded-full sm:size-56"
        aria-label={isRunning ? "Pause timer" : "Start timer"}
      >
        <svg
          className="absolute inset-0 size-full -rotate-90"
          viewBox="0 0 100 100"
          aria-hidden
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            className="stroke-muted"
            strokeWidth="3.5"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            className="stroke-foreground transition-[stroke-dashoffset] duration-1000 ease-linear"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
          />
        </svg>
        <div className="relative text-center">
          <p
            className={cn(
              "font-mono font-semibold tracking-tight tabular-nums",
              remainingSeconds >= 3600 ? "text-4xl" : "text-5xl",
            )}
          >
            {formatFocusClock(remainingSeconds)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isRunning ? "Tap to pause" : "Tap to start"}
          </p>
        </div>
      </button>

      {mode === "focus" && !isRunning ? (
        <div className="mt-6 flex w-full max-w-sm flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
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
                    "rounded-md px-2.5 py-1 text-xs tabular-nums transition-colors",
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
              className="h-8 w-16 text-center"
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
              className="h-8 w-16 text-center"
            />
            {!presetMatch && !customHours && !customMinutes ? (
              <span className="text-xs tabular-nums text-muted-foreground">
                {formatFocusClock(durationSeconds)}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        {isRunning ? (
          <Button type="button" size="lg" onClick={pause}>
            <Pause className="size-4" />
            Pause
          </Button>
        ) : (
          <Button type="button" size="lg" onClick={handleStart}>
            <Play className="size-4" />
            Start
          </Button>
        )}

        <Button
          type="button"
          size="lg"
          variant="ghost"
          className="text-muted-foreground"
          onClick={handleReset}
        >
          <RotateCcw className="size-4" />
          Reset
        </Button>
      </div>

      <FocusSounds />
    </section>
  );
}
