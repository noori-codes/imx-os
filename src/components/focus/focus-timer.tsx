"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { useDocumentVisible } from "@/hooks/use-document-visible";
import { useRouter } from "next/navigation";
import { ChevronDown, CircleCheck, Pause, Play, RotateCcw, SkipForward } from "lucide-react";

import { logFocusSession } from "@/actions/focus";
import { FocusSounds } from "@/components/focus/focus-sounds";
import { Input } from "@/components/ui/input";
import {
  notifyFocusPhase,
  playFocusChime,
  requestFocusNotifyPermission,
} from "@/lib/focus-alerts";
import {
  buildPickupHint,
  continueSubject,
} from "@/lib/focus-continue";
import { cn } from "@/lib/utils";
import { playDefaultFocusSound, stopFocusSound } from "@/stores/focus-sound";
import { nextFocusMode, useFocusTimer, canContinueFocusSession } from "@/stores/focus-timer";
import {
  BREAK_DURATION_PRESETS,
  FOCUS_DURATION_PRESETS,
  FOCUS_MAX_SECONDS,
  FOCUS_POMODOROS_PER_LONG_BREAK,
  FOCUS_PRESETS,
  FOCUS_PROFILES,
  formatFocusClock,
  formatFocusMinutes,
  type FocusClock,
  type FocusMode,
} from "@/types/focus";
import type { FocusLinkableTask } from "@/types/task";

const MODES: FocusMode[] = ["focus", "short_break", "long_break"];
const CLOCKS: { id: FocusClock; label: string; hint: string }[] = [
  { id: "down", label: "Countdown", hint: "Timed blocks" },
  { id: "up", label: "Count up", hint: "Until you stop" },
];

type SealMoment = {
  mode: FocusMode;
  seconds: number;
  todayMinutes: number;
  nextLabel: string;
};

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
  focusMinutesToday = 0,
}: {
  tasks?: FocusLinkableTask[];
  focusMinutesToday?: number;
}) {
  const router = useRouter();
  const pageVisible = useDocumentVisible();
  const {
    mode,
    clock,
    durationSeconds,
    remainingSeconds,
    elapsedSeconds,
    isRunning,
    endsAt,
    startedAt,
    sessionStartedAt,
    completedFocusCount,
    autoStartNext,
    intention,
    linkedTaskId,
    profileId,
    setMode,
    setClock,
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
    displaySeconds,
    tickMs,
    progressBaseSeconds,
  } = useFocusTimer();

  const linkedTask =
    tasks.find((task) => task.id === linkedTaskId) ?? null;
  const shownSeconds = displaySeconds();
  const isStopwatch = clock === "up";
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
  const subject = continueSubject(intention, linkedTask?.title ?? null);
  const pickupHint =
    progressBaseSeconds > 0
      ? buildPickupHint(shownSeconds, subject)
      : null;

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
  const [seal, setSeal] = useState<SealMoment | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("imx-focus-auto-start") === "1";
    if (stored) setAutoStartNext(true);
    hydrateProfile();
  }, [setAutoStartNext, hydrateProfile]);

  useEffect(() => {
    if (!isRunning) return;

    let timeoutId: number;
    const schedule = () => {
      tick();
      const delay = 1000 - (Date.now() % 1000);
      timeoutId = window.setTimeout(schedule, delay);
    };

    schedule();
    return () => window.clearTimeout(timeoutId);
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
    const label = isStopwatch ? "Focus" : FOCUS_PRESETS[mode].label;
    document.title = `${formatFocusClock(shownSeconds)} · ${label}`;
    return () => {
      document.title = previous;
    };
  }, [shownSeconds, mode, isStopwatch]);

  useEffect(() => {
    if (isStopwatch) return;
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

      const addedMinutes =
        currentMode === "focus" ? Math.max(1, Math.round(planned / 60)) : 0;
      if (currentMode === "focus") {
        useFocusTimer.getState().pulseSeal({
          startedAt: new Date(Date.now() - planned * 1000).toISOString(),
          seconds: planned,
        });
      }
      setSeal({
        mode: currentMode,
        seconds: planned,
        todayMinutes: focusMinutesToday + addedMinutes,
        nextLabel,
      });

      advance("complete");

      const next = useFocusTimer.getState();
      if (next.autoStartNext) {
        next.start();
        if (next.mode === "focus") playDefaultFocusSound();
      }
    }
    prevRemaining.current = remainingSeconds;
  }, [
    isStopwatch,
    remainingSeconds,
    mode,
    durationSeconds,
    intention,
    linkedTaskId,
    completedFocusCount,
    focusMinutesToday,
    advance,
    router,
  ]);

  useEffect(() => {
    if (!seal) return;
    const id = window.setTimeout(() => setSeal(null), 3400);
    return () => window.clearTimeout(id);
  }, [seal]);

  useEffect(() => {
    if (!isStopwatch) {
      if (remainingSeconds > 0) loggedRef.current = false;
      return;
    }
    if (elapsedSeconds === 0 && !isRunning) {
      loggedRef.current = false;
    }
  }, [isStopwatch, remainingSeconds, mode, elapsedSeconds, isRunning]);

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

  function sealStopwatch(actual: number) {
    const baseSeconds = useFocusTimer.getState().progressBaseSeconds;
    const incremental = Math.max(0, actual - baseSeconds);
    const logSeconds = baseSeconds > 0 ? incremental : actual;

    if (logSeconds < 5) {
      reset();
      return;
    }

    const note = intention;
    const taskId = linkedTaskId;
    const addedMinutes = Math.max(1, Math.round(logSeconds / 60));
    startTransition(async () => {
      await logFocusSession({
        mode: "focus",
        planned_seconds: logSeconds,
        actual_seconds: logSeconds,
        completed: true,
        note,
        task_id: taskId,
      });
      router.refresh();
    });

    stopFocusSound();
    playFocusChime();
    notifyFocusPhase("Session sealed", formatFocusClock(actual));
    useFocusTimer.getState().pulseSeal({
      startedAt: new Date(Date.now() - logSeconds * 1000).toISOString(),
      seconds: logSeconds,
    });
    setSeal({
      mode: "focus",
      seconds: actual,
      todayMinutes: focusMinutesToday + addedMinutes,
      nextLabel: "Focus",
    });
    loggedRef.current = false;
    reset();
  }

  function handleSealStopwatch() {
    stopFocusSound();
    if (isRunning) pause();
    sealStopwatch(displaySeconds());
  }

  function handleDiscardStopwatch() {
    const actual = displaySeconds();
    if (
      actual >= 5 &&
      !window.confirm("Discard this session without saving?")
    ) {
      return;
    }
    stopFocusSound();
    reset();
  }

  function handleClockChange(next: FocusClock) {
    if (next === clock || isRunning) return;

    if (clock === "up") {
      const actual = displaySeconds();
      if (actual >= 5) {
        sealStopwatch(actual);
      } else if (actual > 0) {
        reset();
      }
    }

    setClock(next);
  }

  useEffect(() => {
    if (!isStopwatch) return;
    const actual = displaySeconds();
    if (actual < FOCUS_MAX_SECONDS) return;
    if (loggedRef.current) return;
    loggedRef.current = true;
    sealStopwatch(FOCUS_MAX_SECONDS);
    // sealStopwatch closes over latest intention/task
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStopwatch, tickMs, elapsedSeconds]);

  function handleStart() {
    const custom = isStopwatch ? undefined : secondsFromCustom();
    void requestFocusNotifyPermission();
    start(custom ?? undefined);
    if (useFocusTimer.getState().mode === "focus" || isStopwatch) {
      playDefaultFocusSound();
    }
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

    if (isStopwatch) {
      handleDiscardStopwatch();
      return;
    }

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
    if (isStopwatch) return;

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
        if (isStopwatch) return;
        e.preventDefault();
        handleSkip();
        return;
      }

      if ((e.key === "r" || e.key === "R") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (isStopwatch) {
          handleSealStopwatch();
          return;
        }
        handleReset();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const progress =
    !isStopwatch && durationSeconds > 0
      ? ((durationSeconds - remainingSeconds) / durationSeconds) * 100
      : 0;
  const dots = filledDots(completedFocusCount, mode);
  const upcoming = nextFocusMode(mode, completedFocusCount, "complete");
  const endedHint =
    !isStopwatch && isRunning && endsAt
      ? `Ends ${formatClockTime(endsAt)}`
      : null;
  const runningHint =
    isStopwatch && sessionStartedAt && (isRunning || shownSeconds > 0)
      ? `Since ${formatClockTime(sessionStartedAt)}`
      : isStopwatch && !isRunning && shownSeconds > 0
        ? "Paused · R to seal"
        : null;
  const canSealStopwatch = isStopwatch && shownSeconds >= 5;

  const activeProfile =
    FOCUS_PROFILES.find((profile) => profile.id === profileId) ?? null;

  const sessionLine =
    mode === "focus" || isStopwatch
      ? intention.trim() || linkedTask?.title || null
      : null;

  const ringRadius = 45.5;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const setupSummary = isStopwatch
    ? "Count up · until you stop"
    : [
        activeProfile?.label ?? "Custom",
        FOCUS_PRESETS[mode].label,
        formatFocusClock(durationSeconds),
      ].join(" · ");

  return (
    <section
      data-mode={mode}
      data-running={isRunning && pageVisible ? "true" : "false"}
      data-visible={pageVisible ? "true" : "false"}
      className="focus-stage group relative flex h-full min-h-[34rem] flex-col overflow-hidden px-2 py-6 sm:min-h-[40rem] sm:px-4 sm:py-8"
      id="focus-timer"
    >
      <div className="focus-stage-glow" aria-hidden />
      {seal ? (
        <button
          type="button"
          className="focus-seal absolute inset-0 z-20 flex items-center justify-center px-6 text-center"
          onClick={() => setSeal(null)}
          aria-label="Dismiss completion"
        >
          <span className="focus-seal-flash" aria-hidden />
          <span className="focus-seal-card relative z-[1] max-w-sm">
            <span className="block text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {seal.mode === "focus" ? "Session sealed" : "Break complete"}
            </span>
            <span className="focus-clock mt-2 block text-3xl text-foreground sm:text-4xl">
              {formatFocusClock(seal.seconds)}
            </span>
            {seal.mode === "focus" ? (
              <span className="mt-2 block text-sm text-foreground/85">
                Today · {formatFocusMinutes(seal.todayMinutes)} focused
              </span>
            ) : (
              <span className="mt-2 block text-sm text-muted-foreground">
                Nicely reset
              </span>
            )}
            <span className="mt-3 block text-xs text-muted-foreground">
              Up next · {seal.nextLabel}
            </span>
          </span>
        </button>
      ) : null}

      <div className="relative z-[1] flex w-full flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center">
        {!isRunning ? (
          <div className="w-full max-w-md text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {isStopwatch
                ? canContinue
                  ? "Continue session"
                  : "Focus session"
                : mode === "focus"
                  ? canContinue
                    ? "Continue session"
                    : "Set your intention"
                  : FOCUS_PRESETS[mode].label}
            </p>

            {canContinue && pickupHint ? (
              <p className="mt-2 text-sm text-muted-foreground">{pickupHint}</p>
            ) : null}

            {mode === "focus" || isStopwatch ? (
              <div className="mt-4 space-y-3">
                <Input
                  value={intention}
                  onChange={(e) => setIntention(e.target.value)}
                  placeholder={
                    linkedTask
                      ? `Working on ${linkedTask.title}`
                      : "What deserves your focus?"
                  }
                  aria-label="What are you focusing on"
                  className="h-12 w-full rounded-2xl border-border/40 bg-transparent px-4 text-center text-lg font-medium tracking-tight shadow-none placeholder:font-normal placeholder:text-muted-foreground/70 focus-visible:ring-1"
                />
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
                    className="h-9 w-full rounded-xl border border-transparent bg-muted/30 px-3 text-center text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus:border-border/50 focus:outline-none"
                  >
                    <option value="">Optional · link an open task</option>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.context
                          ? `${task.title} · ${task.context}`
                          : task.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {isStopwatch
                      ? canContinue
                        ? "Continue · Space"
                        : "Counts up until you seal · Space"
                      : `${activeProfile ? activeProfile.label : "Custom"} · Space to begin`}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                {activeProfile ? activeProfile.label : "Custom"} · Space · S · R
              </p>
            )}
          </div>
        ) : null}

        <div
          className={cn(
            "relative mx-auto flex items-center justify-center",
            isRunning ? "mt-4 sm:mt-6" : "mt-8",
          )}
        >
          <div
            className={cn(
              "relative flex items-center justify-center",
              isRunning
                ? "size-[min(88vw,22rem)] sm:size-[24rem]"
                : "size-[17.5rem] sm:size-[19.5rem]",
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
                      Up next: {FOCUS_PRESETS[upcoming].label}
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-sm tabular-nums text-muted-foreground">
                  {isStopwatch
                    ? canContinue
                      ? pickupHint ??
                        `Paused · ${formatFocusClock(shownSeconds)}`
                      : shownSeconds > 0
                        ? `Paused · ${formatFocusClock(shownSeconds)}`
                        : "Count up · 00:00"
                    : canContinue
                      ? `Paused · ${formatFocusClock(durationSeconds - remainingSeconds)}`
                      : `${FOCUS_PRESETS[mode].label} · ${formatFocusClock(durationSeconds)}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {!isStopwatch ? (
          <div
            className={cn(
              "mt-5 flex items-center gap-2",
              isRunning && "opacity-70",
            )}
            aria-label={`${dots} of ${FOCUS_POMODOROS_PER_LONG_BREAK} toward a long break`}
          >
            {Array.from({ length: FOCUS_POMODOROS_PER_LONG_BREAK }).map(
              (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "size-1.5 rounded-full transition-colors",
                    i < dots ? "bg-foreground" : "bg-muted-foreground/25",
                  )}
                />
              ),
            )}
          </div>
        ) : (
          <p className="mt-5 text-xs text-muted-foreground">
            {isRunning
              ? "Pause anytime · R seals · ↺ discards"
              : canContinue
                ? "Continue · R seals · Space · ↺ discards"
                : shownSeconds > 0
                  ? "R seals · Continue · Space · ↺ discards"
                  : "Start focus · no timer limit"}
          </p>
        )}

        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={handleReset}
              className={cn(
                "flex size-12 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
                isRunning &&
                  "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100",
              )}
              aria-label={
                isStopwatch && shownSeconds >= 5
                  ? "Discard session"
                  : "Reset timer"
              }
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
              aria-label={
                isRunning
                  ? "Pause timer"
                  : canContinue
                    ? "Continue session"
                    : isStopwatch
                      ? "Start focus"
                      : "Begin session"
              }
            >
              {isRunning ? (
                <Pause className="size-6 fill-current" />
              ) : (
                <Play className="size-6 fill-current pl-0.5" />
              )}
            </button>
            {!isStopwatch ? (
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
            ) : (
              <button
                type="button"
                onClick={handleSealStopwatch}
                disabled={!canSealStopwatch}
                className={cn(
                  "flex size-12 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
                  !canSealStopwatch && "pointer-events-none opacity-30",
                  isRunning &&
                    "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100",
                  canSealStopwatch &&
                    isRunning &&
                    "group-hover:opacity-100 max-sm:opacity-100",
                )}
                aria-label="Seal session"
              >
                <CircleCheck className="size-5" />
              </button>
            )}
          </div>
          {!isRunning ? (
            <p className="text-xs text-muted-foreground">
              {canContinue
                ? "Continue · Space"
                : isStopwatch
                  ? "Start focus · Space"
                  : mode === "focus"
                    ? "Begin session"
                    : "Start break"}{" "}
              {!isStopwatch ? "· Space" : null}
            </p>
          ) : null}
        </div>

        {!isRunning ? (
          <details className="group/setup mt-6 w-full max-w-md">
            <summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
              <span className="tabular-nums">Setup · {setupSummary}</span>
              <ChevronDown className="size-3.5 shrink-0 transition-transform duration-200 group-open/setup:rotate-180" />
            </summary>

            <div className="mt-4 space-y-4 p-1">
              <div
                className="flex w-full justify-center gap-1 rounded-full bg-muted/30 p-1"
                role="tablist"
                aria-label="Clock style"
              >
                {CLOCKS.map((item) => {
                  const active = clock === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => handleClockChange(item.id)}
                      className={cn(
                        "min-w-0 flex-1 rounded-full px-3 py-2 text-left transition-colors sm:text-center",
                        active
                          ? "bg-background font-medium text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span className="block text-sm">{item.label}</span>
                      <span
                        className={cn(
                          "block text-[11px]",
                          active
                            ? "text-foreground/60"
                            : "text-muted-foreground",
                        )}
                      >
                        {item.hint}
                      </span>
                    </button>
                  );
                })}
              </div>

              {isStopwatch ? (
                <p className="text-center text-xs text-muted-foreground">
                  Starts at 00:00 · R seals when done · ↺ discards
                </p>
              ) : (
                <>
              <div className="grid grid-cols-3 gap-2">
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
                        "rounded-xl px-2.5 py-2 text-left transition-colors",
                        active
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      )}
                      aria-pressed={active}
                    >
                      <span className="block text-sm font-medium">
                        {profile.label}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 block text-[11px] tabular-nums",
                          active
                            ? "text-background/70"
                            : "text-muted-foreground",
                        )}
                      >
                        {profile.hint}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div
                className="flex w-full justify-center gap-1 rounded-full bg-muted/30 p-1"
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

              <div className="flex flex-col items-center gap-3">
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
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
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
                      className="h-9 w-16 rounded-xl border-border/40 bg-transparent text-center"
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
                      className="h-9 w-16 rounded-xl border-border/40 bg-transparent text-center"
                    />
                    {!presetMatch && !customHours && !customMinutes ? (
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatFocusClock(durationSeconds)}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setAutoStartNext(!autoStartNext)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs transition-colors",
                    autoStartNext
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  Auto-start {autoStartNext ? "on" : "off"}
                </button>
              </div>
                </>
              )}
            </div>
          </details>
        ) : null}
        </div>

        <div
          className={cn(
            "mx-auto mt-auto w-full max-w-xl pt-10 transition-opacity duration-500",
            isRunning && "opacity-85",
          )}
        >
          <FocusSounds />
        </div>
      </div>
    </section>
  );
}
