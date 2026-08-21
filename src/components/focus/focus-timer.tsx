"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";

import { logFocusSession } from "@/actions/focus";
import { Input } from "@/components/ui/input";
import {
  notifyFocusPhase,
  playFocusChime,
  requestFocusNotifyPermission,
} from "@/lib/focus-alerts";
import { cn } from "@/lib/utils";
import { playDefaultFocusSound, stopFocusSound } from "@/stores/focus-sound";
import { nextFocusMode, useFocusTimer } from "@/stores/focus-timer";
import {
  BREAK_DURATION_PRESETS,
  FOCUS_DURATION_PRESETS,
  FOCUS_MAX_SECONDS,
  FOCUS_POMODOROS_PER_LONG_BREAK,
  FOCUS_PRESETS,
  FOCUS_PROFILES,
  formatFocusClock,
  type FocusMode,
} from "@/types/focus";
import type { FocusLinkableTask } from "@/types/task";

const MODES: FocusMode[] = ["focus", "short_break", "long_break"];

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  if (target.closest("button, a, [role='button']")) return true;
  return false;
}

function formatClockTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function filledDots(count: number, mode: FocusMode) {
  const inRound = count % FOCUS_POMODOROS_PER_LONG_BREAK;
  if (
    inRound === 0 &&
    count > 0 &&
    mode === "long_break"
  ) {
    return FOCUS_POMODOROS_PER_LONG_BREAK;
  }
  return inRound;
}

export function FocusTimer({
  tasks = [],
}: {
  tasks?: FocusLinkableTask[];
}) {
  const router = useRouter();
  const {
    mode,
    durationSeconds,
    remainingSeconds,
    isRunning,
    endsAt,
    completedFocusCount,
    autoStartNext,
    intention,
    linkedTaskId,
    profileId,
    setMode,
    setDuration,
    setIntention,
    setLinkedTaskId,
    setAutoStartNext,
    applyProfile,
    hydrateProfile,
    start,
    pause,
    reset,
    skip,
    advance,
    tick,
  } = useFocusTimer();

  const linkedTask =
    tasks.find((task) => task.id === linkedTaskId) ?? null;

  useEffect(() => {
    if (linkedTaskId && !tasks.some((task) => task.id === linkedTaskId)) {
      setLinkedTaskId(null);
    }
  }, [linkedTaskId, tasks, setLinkedTaskId]);

  const [, startTransition] = useTransition();
  const loggedRef = useRef(false);
  const prevRemaining = useRef(remainingSeconds);
  const [customHours, setCustomHours] = useState("");
  const [customMinutes, setCustomMinutes] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem("imx-focus-auto-start") === "1";
    if (stored) setAutoStartNext(true);
    hydrateProfile();
  }, [setAutoStartNext, hydrateProfile]);

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => tick(), 500);
    return () => window.clearInterval(id);
  }, [isRunning, tick]);

  useEffect(() => {
    function catchUp() {
      tick();
    }
    document.addEventListener("visibilitychange", catchUp);
    window.addEventListener("focus", catchUp);
    return () => {
      document.removeEventListener("visibilitychange", catchUp);
      window.removeEventListener("focus", catchUp);
    };
  }, [tick]);

  useEffect(() => {
    const previous = document.title;
    document.title = `${formatFocusClock(remainingSeconds)} · ${FOCUS_PRESETS[mode].label}`;
    return () => {
      document.title = previous;
    };
  }, [remainingSeconds, mode]);

  useEffect(() => {
    if (
      remainingSeconds === 0 &&
      prevRemaining.current > 0 &&
      !loggedRef.current
    ) {
      loggedRef.current = true;
      const planned = durationSeconds;
      const currentMode = mode;
      const note = currentMode === "focus" ? intention : "";
      const taskId = currentMode === "focus" ? linkedTaskId : null;
      const nextLabel =
        FOCUS_PRESETS[nextFocusMode(currentMode, completedFocusCount, "complete")]
          .label;

      startTransition(async () => {
        await logFocusSession({
          mode: currentMode,
          planned_seconds: planned,
          actual_seconds: planned,
          completed: true,
          note,
          task_id: taskId,
        });
        router.refresh();
      });

      stopFocusSound();
      playFocusChime();
      notifyFocusPhase(`${FOCUS_PRESETS[currentMode].label} done`, `Up next: ${nextLabel}`);
      advance("complete");

      const next = useFocusTimer.getState();
      if (next.autoStartNext) {
        next.start();
        if (next.mode === "focus") playDefaultFocusSound();
      }
    }
    prevRemaining.current = remainingSeconds;
  }, [
    remainingSeconds,
    mode,
    durationSeconds,
    intention,
    linkedTaskId,
    completedFocusCount,
    advance,
    router,
  ]);

  useEffect(() => {
    if (remainingSeconds > 0) {
      loggedRef.current = false;
    }
  }, [remainingSeconds, mode]);

  const durationMinutes = Math.round(durationSeconds / 60);
  const durationPresets =
    mode === "focus" ? FOCUS_DURATION_PRESETS : BREAK_DURATION_PRESETS[mode];
  const presetMatch = durationPresets.some(
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
    void requestFocusNotifyPermission();
    start(custom ?? undefined);
    if (useFocusTimer.getState().mode === "focus") playDefaultFocusSound();
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
    const note = currentMode === "focus" ? intention : "";
    const taskId = currentMode === "focus" ? linkedTaskId : null;
    startTransition(async () => {
      if (actual >= 5) {
        await logFocusSession({
          mode: currentMode,
          planned_seconds: planned,
          actual_seconds: actual,
          completed: false,
          note,
          task_id: taskId,
        });
        router.refresh();
      }
      reset();
    });
  }

  function handleSkip() {
    const actual = durationSeconds - remainingSeconds;
    const currentMode = mode;
    const planned = durationSeconds;
    const note = currentMode === "focus" ? intention : "";
    const taskId = currentMode === "focus" ? linkedTaskId : null;

    stopFocusSound();

    if (actual >= 5) {
      startTransition(async () => {
        await logFocusSession({
          mode: currentMode,
          planned_seconds: planned,
          actual_seconds: actual,
          completed: false,
          note,
          task_id: taskId,
        });
        router.refresh();
      });
    }

    skip();
    const next = useFocusTimer.getState();
    if (next.autoStartNext) {
      next.start();
      if (next.mode === "focus") playDefaultFocusSound();
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;

      if (e.code === "Space") {
        e.preventDefault();
        handleToggle();
        return;
      }

      if ((e.key === "s" || e.key === "S") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleSkip();
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
  const dots = filledDots(completedFocusCount, mode);
  const upcoming = nextFocusMode(mode, completedFocusCount, "complete");
  const endedHint =
    isRunning && endsAt ? `Ends ${formatClockTime(endsAt)}` : null;

  const activeProfile =
    FOCUS_PROFILES.find((profile) => profile.id === profileId) ?? null;

  const sessionLine =
    mode === "focus"
      ? intention.trim() || linkedTask?.title || null
      : null;

  return (
    <section
      data-mode={mode}
      data-running={isRunning ? "true" : "false"}
      className="focus-stage group relative flex h-full min-h-[28rem] flex-col items-center justify-center overflow-hidden px-2 py-6 sm:min-h-[32rem] sm:px-4 sm:py-8"
    >
      <div className="focus-stage-glow" aria-hidden />
      <div className="relative z-[1] flex w-full max-w-xl flex-col items-center">
        <div className="text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {mode === "focus" ? "Deep work" : FOCUS_PRESETS[mode].label}
          </p>
          {!isRunning ? (
            <p className="mt-1.5 text-sm text-muted-foreground">
              {activeProfile ? activeProfile.label : "Custom"}
              {" · Space · S · R"}
            </p>
          ) : sessionLine ? (
            <p className="mt-2 max-w-sm truncate text-sm text-foreground/80">
              {sessionLine}
            </p>
          ) : (
            <p className="mt-1.5 text-sm text-muted-foreground">
              {endedHint ?? `Up next: ${FOCUS_PRESETS[upcoming].label}`}
            </p>
          )}
        </div>

        {!isRunning ? (
          <div className="mt-6 grid w-full grid-cols-3 gap-2">
            {FOCUS_PROFILES.map((profile) => {
              const active = profileId === profile.id;
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => {
                    setCustomHours("");
                    setCustomMinutes("");
                    applyProfile(profile.id);
                  }}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-left transition-colors",
                    active
                      ? "bg-foreground text-background"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  aria-pressed={active}
                >
                  <span className="block text-sm font-medium">
                    {profile.label}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block text-[11px] tabular-nums",
                      active ? "text-background/70" : "text-muted-foreground",
                    )}
                  >
                    {profile.hint}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {!isRunning ? (
          <div
            className="mt-5 flex w-full justify-center gap-1 rounded-full bg-muted/35 p-1"
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
                  onClick={() => {
                    setCustomHours("");
                    setCustomMinutes("");
                    setMode(m);
                  }}
                  className={cn(
                    "min-w-0 flex-1 rounded-full px-3 py-1.5 text-sm transition-colors",
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
        ) : null}

        <div
          className={cn(
            "relative mx-auto flex items-center justify-center",
            isRunning ? "mt-10 sm:mt-14" : "mt-8",
          )}
        >
          <div
            className={cn(
              "relative flex items-center justify-center",
              isRunning
                ? "size-[min(88vw,22rem)] sm:size-[24rem]"
                : "size-64 sm:size-72",
            )}
          >
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
                className="stroke-muted/70"
                strokeWidth={isRunning ? "1.5" : "2"}
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                className="stroke-foreground transition-[stroke-dashoffset] duration-500 ease-linear"
                strokeWidth={isRunning ? "1.5" : "2"}
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
              />
            </svg>

            <div className="relative px-6 text-center">
              <p
                className={cn(
                  "font-mono font-medium tracking-[-0.03em] tabular-nums leading-none text-foreground",
                  remainingSeconds >= 3600
                    ? "text-[clamp(2.25rem,6.5vw,3.75rem)]"
                    : "text-[clamp(2.75rem,8vw,4.75rem)]",
                )}
              >
                {formatFocusClock(remainingSeconds)}
              </p>
              {!isRunning ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  {FOCUS_PRESETS[mode].label}
                </p>
              ) : endedHint ? (
                <p className="mt-4 text-sm text-muted-foreground">{endedHint}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div
          className={cn(
            "mt-5 flex items-center gap-2",
            isRunning && "opacity-70",
          )}
          aria-label={`${dots} of ${FOCUS_POMODOROS_PER_LONG_BREAK} toward a long break`}
        >
          {Array.from({ length: FOCUS_POMODOROS_PER_LONG_BREAK }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "size-1.5 rounded-full transition-colors",
                i < dots ? "bg-foreground" : "bg-muted-foreground/25",
              )}
            />
          ))}
        </div>

        {mode === "focus" && !isRunning ? (
          <div className="mt-6 flex w-full max-w-sm flex-col gap-2">
            {tasks.length > 0 ? (
              <select
                value={linkedTaskId ?? ""}
                onChange={(e) => {
                  const nextId = e.target.value || null;
                  setLinkedTaskId(nextId);
                  if (nextId && !intention.trim()) {
                    const task = tasks.find((item) => item.id === nextId);
                    if (task) setIntention(task.title);
                  }
                }}
                aria-label="Link a task"
                className="h-9 w-full rounded-xl border border-border/50 bg-transparent px-3 text-sm text-foreground"
              >
                <option value="">No linked task</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.context
                      ? `${task.title} · ${task.context}`
                      : task.title}
                  </option>
                ))}
              </select>
            ) : null}
            <Input
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder={
                linkedTask ? `Working on ${linkedTask.title}` : "Working on…"
              }
              aria-label="What are you focusing on"
              className="h-9 w-full rounded-xl border-border/50 bg-transparent text-center"
            />
          </div>
        ) : null}

        {!isRunning ? (
          <div className="mt-5 flex w-full max-w-md flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {durationPresets.map((preset) => {
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
                      "rounded-full px-3 py-1 text-sm tabular-nums transition-colors",
                      active
                        ? "bg-foreground text-background"
                        : "bg-muted/50 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            {mode === "focus" ? (
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
                  className="h-9 w-16 rounded-xl border-border/50 bg-transparent text-center"
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
                  className="h-9 w-16 rounded-xl border-border/50 bg-transparent text-center"
                />
                {!presetMatch && !customHours && !customMinutes ? (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {formatFocusClock(durationSeconds)}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={handleReset}
            className={cn(
              "flex size-12 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
              isRunning &&
                "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100",
            )}
            aria-label="Reset timer"
          >
            <RotateCcw className="size-5" />
          </button>
          <button
            type="button"
            onClick={handleToggle}
            className={cn(
              "flex items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-[1.03] active:scale-95",
              isRunning ? "size-[4.25rem]" : "size-16",
            )}
            aria-label={isRunning ? "Pause timer" : "Start timer"}
          >
            {isRunning ? (
              <Pause className="size-6 fill-current" />
            ) : (
              <Play className="size-6 fill-current pl-0.5" />
            )}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className={cn(
              "flex size-12 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
              isRunning &&
                "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100",
            )}
            aria-label="Skip to next phase"
          >
            <SkipForward className="size-5" />
          </button>
        </div>

        {!isRunning ? (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => setAutoStartNext(!autoStartNext)}
              className={cn(
                "rounded-full px-3 py-1 transition-colors",
                autoStartNext
                  ? "bg-foreground text-background"
                  : "hover:bg-muted hover:text-foreground",
              )}
            >
              Auto-start {autoStartNext ? "on" : "off"}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
