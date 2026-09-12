"use client";

import { useEffect, useRef, useTransition } from "react";

import { useDocumentVisible } from "@/hooks/use-document-visible";
import { useRouter } from "next/navigation";
import { CircleCheck, Pause, Play, RotateCcw, SkipForward } from "lucide-react";

import { logFocusSession, updateFocusSession } from "@/actions/focus";
import { toggleTaskComplete } from "@/actions/tasks";
import { FocusClockFace } from "@/components/focus/focus-clock-face";
import { FocusSettings } from "@/components/focus/focus-settings";
import { FocusSounds } from "@/components/focus/focus-sounds";
import { showFocusSealToast } from "@/components/focus/focus-seal-toast";
import { confirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import {
  notifyFocusPhase,
  playFocusChime,
  requestFocusNotifyPermission,
} from "@/lib/focus-alerts";
import {
  commitFocusSessionOptimistic,
} from "@/lib/focus-optimistic";
import {
  celebrateMarathonSessionIfNeeded,
} from "@/lib/focus-celebrate";
import {
  buildPickupHint,
  continueSubject,
} from "@/lib/focus-continue";
import { cn } from "@/lib/utils";
import { stopFocusSound, useFocusSound } from "@/stores/focus-sound";
import { nextFocusMode, useFocusTimer, canContinueFocusSession } from "@/stores/focus-timer";
import {
  FOCUS_MAX_SECONDS,
  FOCUS_POMODOROS_PER_LONG_BREAK,
  FOCUS_PRESETS,
  FOCUS_PROFILES,
  formatFocusClock,
  formatFocusMinutes,
  buildOptimisticFocusSession,
  type FocusClock,
  type FocusMode,
} from "@/types/focus";
import type { FocusLinkableTask } from "@/types/task";

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
  dailyGoalMinutes,
  initialTaskId = null,
}: {
  tasks?: FocusLinkableTask[];
  focusMinutesToday?: number;
  dailyGoalMinutes?: number;
  initialTaskId?: string | null;
}) {
  const router = useRouter();
  const pageVisible = useDocumentVisible();
  const mode = useFocusTimer((s) => s.mode);
  const clock = useFocusTimer((s) => s.clock);
  const durationSeconds = useFocusTimer((s) => s.durationSeconds);
  const remainingSeconds = useFocusTimer((s) => s.remainingSeconds);
  const elapsedSeconds = useFocusTimer((s) => s.elapsedSeconds);
  const isRunning = useFocusTimer((s) => s.isRunning);
  const endsAt = useFocusTimer((s) => s.endsAt);
  const sessionStartedAt = useFocusTimer((s) => s.sessionStartedAt);
  const completedFocusCount = useFocusTimer((s) => s.completedFocusCount);
  const autoStartNext = useFocusTimer((s) => s.autoStartNext);
  const intention = useFocusTimer((s) => s.intention);
  const linkedTaskId = useFocusTimer((s) => s.linkedTaskId);
  const profileId = useFocusTimer((s) => s.profileId);
  const progressBaseSeconds = useFocusTimer((s) => s.progressBaseSeconds);
  const setMode = useFocusTimer((s) => s.setMode);
  const setClock = useFocusTimer((s) => s.setClock);
  const setDuration = useFocusTimer((s) => s.setDuration);
  const setIntention = useFocusTimer((s) => s.setIntention);
  const setLinkedTaskId = useFocusTimer((s) => s.setLinkedTaskId);
  const setAutoStartNext = useFocusTimer((s) => s.setAutoStartNext);
  const applyProfile = useFocusTimer((s) => s.applyProfile);
  const hydrateProfile = useFocusTimer((s) => s.hydrateProfile);
  const start = useFocusTimer((s) => s.start);
  const pause = useFocusTimer((s) => s.pause);
  const reset = useFocusTimer((s) => s.reset);
  const skip = useFocusTimer((s) => s.skip);
  const advance = useFocusTimer((s) => s.advance);
  const tick = useFocusTimer((s) => s.tick);
  const soundPlaying = useFocusSound((s) => s.playing);
  const soundId = useFocusSound((s) => s.activeId);

  const linkedTask =
    tasks.find((task) => task.id === linkedTaskId) ?? null;
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
  const sessionSecondsHint = isStopwatch
    ? elapsedSeconds
    : Math.max(0, durationSeconds - remainingSeconds);
  const pickupHint =
    progressBaseSeconds > 0
      ? buildPickupHint(sessionSecondsHint, subject)
      : null;

  const appliedTaskParam = useRef(false);
  useEffect(() => {
    if (appliedTaskParam.current) return;
    if (!initialTaskId || isRunning) return;
    const task = tasks.find((item) => item.id === initialTaskId);
    if (!task) return;
    appliedTaskParam.current = true;
    setLinkedTaskId(task.id);
    if (!useFocusTimer.getState().intention.trim()) {
      setIntention(task.title);
    }
  }, [initialTaskId, tasks, isRunning, setLinkedTaskId, setIntention]);

  useEffect(() => {
    if (linkedTaskId && !tasks.some((task) => task.id === linkedTaskId)) {
      setLinkedTaskId(null);
    }
  }, [linkedTaskId, tasks, setLinkedTaskId]);

  const [, startTransition] = useTransition();
  const loggedRef = useRef(false);
  const flowNudgeRef = useRef(false);
  const todayMinutesRef = useRef(focusMinutesToday);
  const prevRemaining = useRef(remainingSeconds);
  useEffect(() => {
    todayMinutesRef.current = focusMinutesToday;
  }, [focusMinutesToday]);

  useEffect(() => {
    const stored = window.localStorage.getItem("imx-focus-auto-start") === "1";
    if (stored) setAutoStartNext(true);
    hydrateProfile();
  }, [setAutoStartNext, hydrateProfile]);

  useEffect(() => {
    if (!isRunning) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) return;

    // Hidden tab: no 1s React loop (battery). Ambient keeps playing;
    // wall-clock still advances; one shot fires when a countdown is due.
    if (!pageVisible) {
      const { clock, endsAt } = useFocusTimer.getState();
      if (clock !== "down" || !endsAt) return;
      const delay = Math.max(0, endsAt - Date.now()) + 40;
      const id = window.setTimeout(() => {
        tick();
      }, delay);
      return () => window.clearTimeout(id);
    }

    let timeoutId: number;
    const schedule = () => {
      const finished = tick();
      const state = useFocusTimer.getState();

      if (
        state.clock === "up" &&
        state.isRunning &&
        !flowNudgeRef.current &&
        state.liveElapsedSeconds() >= 90 * 60
      ) {
        flowNudgeRef.current = true;
        notifyFocusPhase(
          "Still in flow?",
          "90 minutes in · seal whenever you’re ready",
        );
      }

      if (finished && state.clock === "up") {
        const actual = state.elapsedSeconds;
        if (actual >= FOCUS_MAX_SECONDS && !loggedRef.current) {
          loggedRef.current = true;
          sealStopwatch(FOCUS_MAX_SECONDS);
        }
      }

      const delay = 1000 - (Date.now() % 1000);
      timeoutId = window.setTimeout(schedule, delay);
    };

    schedule();
    return () => window.clearTimeout(timeoutId);
    // sealStopwatch is stable enough via latest closures for max-seconds edge case
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, tick, pageVisible]);

  useEffect(() => {
    function catchUp() {
      if (document.visibilityState !== "visible") return;
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
    if (!isStopwatch || isRunning) return;
    if (elapsedSeconds < 60) flowNudgeRef.current = false;
  }, [isStopwatch, isRunning, elapsedSeconds]);

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

      const startedAt = new Date(Date.now() - planned * 1000).toISOString();

      commitFocusSessionOptimistic(
        buildOptimisticFocusSession({
          mode: currentMode,
          planned_seconds: planned,
          actual_seconds: planned,
          completed: true,
          note,
          task_id: taskId,
          task_title: linkedTask?.title ?? null,
          started_at: startedAt,
        }),
        currentMode === "focus" ? planned : 0,
      );

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
      const todayMinutes = todayMinutesRef.current + addedMinutes;
      if (currentMode === "focus") {
        todayMinutesRef.current = todayMinutes;
      }

      const linkedTaskForToast =
        currentMode === "focus" && taskId
          ? {
              id: taskId,
              title: linkedTask?.title ?? (intention.trim() || "this task"),
            }
          : null;

      if (currentMode === "focus") {
        const markDone = linkedTaskForToast
          ? () => {
              setLinkedTaskId(null);
              startTransition(async () => {
                await toggleTaskComplete(linkedTaskForToast.id, true);
                router.refresh();
              });
              showFocusSealToast({
                kind: "task",
                title: "Task done",
                taskTitle: linkedTaskForToast.title,
              });
            }
          : undefined;

        const marathon = celebrateMarathonSessionIfNeeded({
          sessionSeconds: planned,
          todayMinutes,
          nextLabel,
          onMarkDone: markDone,
        });

        if (!marathon) {
          showFocusSealToast({
            kind: "focus",
            title: "Session sealed",
            seconds: planned,
            todayMinutes,
            nextLabel,
            onMarkDone: markDone,
          });
        }
      } else {
        showFocusSealToast({
          kind: "break",
          title: "Break complete",
          seconds: planned,
          nextLabel,
        });
      }

      advance("complete");

      const next = useFocusTimer.getState();
      if (next.autoStartNext) {
        next.start();
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
    dailyGoalMinutes,
    advance,
    router,
    linkedTask?.title,
    setLinkedTaskId,
  ]);

  useEffect(() => {
    if (!isStopwatch) {
      if (remainingSeconds > 0) loggedRef.current = false;
      return;
    }
    if (elapsedSeconds === 0 && !isRunning) {
      loggedRef.current = false;
    }
  }, [isStopwatch, remainingSeconds, mode, elapsedSeconds, isRunning]);

  function sealStopwatch(actual: number) {
    const {
      progressBaseSeconds,
      continuedSessionId,
      continuedMergeIds,
      sessionStartedAt: continuedStartedAt,
    } = useFocusTimer.getState();
    const incremental = Math.max(0, actual - progressBaseSeconds);
    const isContinuation = continuedSessionId !== null;

    if (isContinuation) {
      if (incremental < 5) {
        reset();
        return;
      }
    } else {
      if (actual < 5) {
        reset();
        return;
      }
    }

    const note = intention;
    const taskId = linkedTaskId;
    const addedMinutes = Math.max(1, Math.round(incremental / 60));
    const sealStartedAt =
      isContinuation && continuedStartedAt
        ? new Date(continuedStartedAt).toISOString()
        : new Date(Date.now() - actual * 1000).toISOString();

    const sealSeconds = isContinuation ? incremental : actual;
    const session = buildOptimisticFocusSession({
      id: isContinuation && continuedSessionId ? continuedSessionId : undefined,
      mode: "focus",
      planned_seconds: isContinuation
        ? Math.max(actual, progressBaseSeconds)
        : actual,
      actual_seconds: actual,
      completed: true,
      note,
      task_id: taskId,
      task_title: linkedTask?.title ?? null,
      started_at: sealStartedAt,
    });
    commitFocusSessionOptimistic(session, sealSeconds);

    startTransition(async () => {
      if (isContinuation && continuedSessionId) {
        await updateFocusSession({
          sessionId: continuedSessionId,
          actual_seconds: actual,
          planned_seconds: Math.max(actual, progressBaseSeconds),
          completed: true,
          note,
          task_id: taskId,
          ended_at: new Date().toISOString(),
          started_at:
            continuedStartedAt != null
              ? new Date(continuedStartedAt).toISOString()
              : undefined,
          absorbIds: continuedMergeIds,
        });
      } else {
        await logFocusSession({
          mode: "focus",
          planned_seconds: actual,
          actual_seconds: actual,
          completed: true,
          note,
          task_id: taskId,
        });
      }
      router.refresh();
    });

    stopFocusSound();
    playFocusChime();
    notifyFocusPhase("Session sealed", formatFocusClock(actual));

    const todayMinutes = todayMinutesRef.current + addedMinutes;
    todayMinutesRef.current = todayMinutes;

    const linkedTaskForToast = taskId
      ? {
          id: taskId,
          title: linkedTask?.title ?? (note.trim() || "this task"),
        }
      : null;

    const markDone = linkedTaskForToast
      ? () => {
          setLinkedTaskId(null);
          startTransition(async () => {
            await toggleTaskComplete(linkedTaskForToast.id, true);
            router.refresh();
          });
          showFocusSealToast({
            kind: "task",
            title: "Task done",
            taskTitle: linkedTaskForToast.title,
          });
        }
      : undefined;

    const marathon = celebrateMarathonSessionIfNeeded({
      sessionSeconds: actual,
      todayMinutes,
      onMarkDone: markDone,
    });

    if (!marathon) {
      showFocusSealToast({
        kind: "focus",
        title: "Session sealed",
        seconds: actual,
        todayMinutes,
        onMarkDone: markDone,
      });
    }

    loggedRef.current = false;
    reset();
  }

  function handleSealStopwatch() {
    stopFocusSound();
    if (isRunning) pause();
    sealStopwatch(useFocusTimer.getState().displaySeconds());
  }

  function handleDiscardStopwatch() {
    const actual = useFocusTimer.getState().displaySeconds();
    if (actual >= 5) {
      void (async () => {
        const ok = await confirm({
          title: "Discard this session?",
          description: "Your time won’t be saved.",
          confirmLabel: "Discard",
          destructive: true,
        });
        if (!ok) return;
        stopFocusSound();
        reset();
      })();
      return;
    }
    stopFocusSound();
    reset();
  }

  function handleClockChange(next: FocusClock) {
    if (next === clock || isRunning) return;

    if (clock === "up") {
      const actual = useFocusTimer.getState().displaySeconds();
      if (actual >= 5) {
        sealStopwatch(actual);
      } else if (actual > 0) {
        reset();
      }
    }

    setClock(next);
  }

  function handleStart() {
    void requestFocusNotifyPermission();
    start();
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

    if (actual >= 5 && currentMode === "focus") {
      const startedAt = new Date(Date.now() - actual * 1000).toISOString();
      commitFocusSessionOptimistic(
        buildOptimisticFocusSession({
          mode: currentMode,
          planned_seconds: planned,
          actual_seconds: actual,
          completed: false,
          note,
          task_id: taskId,
          task_title: linkedTask?.title ?? null,
          started_at: startedAt,
        }),
      );
      const addedMinutes = Math.max(1, Math.round(actual / 60));
      todayMinutesRef.current += addedMinutes;
    }

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

    if (actual >= 5 && currentMode === "focus") {
      const startedAt = new Date(Date.now() - actual * 1000).toISOString();
      commitFocusSessionOptimistic(
        buildOptimisticFocusSession({
          mode: currentMode,
          planned_seconds: planned,
          actual_seconds: actual,
          completed: false,
          note,
          task_id: taskId,
          task_title: linkedTask?.title ?? null,
          started_at: startedAt,
        }),
      );
      const addedMinutes = Math.max(1, Math.round(actual / 60));
      todayMinutesRef.current += addedMinutes;
    }

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

  const dots = filledDots(completedFocusCount, mode);
  const upcoming = nextFocusMode(mode, completedFocusCount, "complete");
  const endedHint =
    !isStopwatch && isRunning && endsAt
      ? `Ends ${formatClockTime(endsAt)}`
      : null;
  const runningHint =
    isStopwatch && sessionStartedAt && (isRunning || elapsedSeconds > 0)
      ? `Since ${formatClockTime(sessionStartedAt)}`
      : isStopwatch && !isRunning && elapsedSeconds > 0
        ? "Paused · R to seal"
        : null;
  const canSealStopwatch = isStopwatch && (isRunning || elapsedSeconds >= 5);

  const activeProfile =
    FOCUS_PROFILES.find((profile) => profile.id === profileId) ?? null;

  const sessionLine =
    mode === "focus" || isStopwatch
      ? intention.trim() || linkedTask?.title || null
      : null;

  const ringRadius = 45.5;
  const ringCircumference = 2 * Math.PI * ringRadius;

  const runningLabel = isStopwatch
    ? "Count up"
    : mode === "focus"
      ? "Deep work"
      : FOCUS_PRESETS[mode].label;

  const runningDetail =
    sessionLine ??
    endedHint ??
    runningHint ??
    (!isStopwatch ? `Up next · ${FOCUS_PRESETS[upcoming].label}` : null);

  return (
    <section
      data-mode={mode}
      data-sound={soundPlaying ? soundId : undefined}
      data-running={isRunning && pageVisible ? "true" : "false"}
      data-visible={pageVisible ? "true" : "false"}
      className={cn(
        "focus-stage group relative flex w-full flex-col overflow-hidden",
        isRunning
          ? "h-full min-h-0 flex-1 items-center justify-center px-5 py-5 sm:px-8 sm:py-6"
          : "px-1 py-4 sm:px-2 sm:py-6",
      )}
      id="focus-timer"
    >
      <div className="focus-stage-vignette" aria-hidden />
      <div className="focus-stage-grain" aria-hidden />
      <div className="focus-stage-glow-soft" aria-hidden />
      <div className="focus-stage-glow" aria-hidden />

      {isRunning ? (
        <div className="focus-run relative z-1 mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-8 px-1 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 xl:gap-14">
          <div className="flex min-w-0 flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2.5">
              <span className="focus-live-dot" aria-hidden />
              <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
                {runningLabel}
              </p>
            </div>

            <div className="focus-clock-jewel relative mt-5 flex size-[min(62vw,16.5rem)] items-center justify-center sm:mt-6 sm:size-[19rem] lg:mt-8 lg:size-[22rem]">
              <div className="focus-clock-spin" aria-hidden />
              <FocusClockFace
                isRunning={isRunning}
                isStopwatch={isStopwatch}
                canContinue={canContinue}
                mode={mode}
                durationSeconds={durationSeconds}
                subject={subject}
                sessionLine={sessionLine}
                pickupHint={pickupHint}
                endedHint={endedHint}
                runningHint={runningHint}
                upcomingLabel={FOCUS_PRESETS[upcoming].label}
                ringRadius={ringRadius}
                ringCircumference={ringCircumference}
                compactHints
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-col items-center justify-center gap-6 text-center lg:gap-7">
            {runningDetail ? (
              <p className="max-w-[20rem] truncate text-[13px] tracking-[0.04em] text-foreground/70 sm:max-w-[24rem]">
                {runningDetail}
              </p>
            ) : (
              <p className="text-[13px] tracking-[0.04em] text-muted-foreground">
                In session
              </p>
            )}

            {!isStopwatch ? (
              <div
                className="flex items-center justify-center gap-2.5"
                aria-label={`${dots} of ${FOCUS_POMODOROS_PER_LONG_BREAK} toward a long break`}
              >
                {Array.from({ length: FOCUS_POMODOROS_PER_LONG_BREAK }).map(
                  (_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "size-1.5 rounded-full transition-colors",
                        i < dots
                          ? "bg-(--focus-accent)"
                          : "bg-muted-foreground/25",
                      )}
                    />
                  ),
                )}
              </div>
            ) : null}

            <div className="focus-run-controls flex items-center justify-center gap-4 sm:gap-5">
              <button
                type="button"
                onClick={handleReset}
                className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                aria-label={
                  canSealStopwatch ? "Discard session" : "Reset timer"
                }
              >
                <RotateCcw className="size-4" />
              </button>
              <button
                type="button"
                onClick={handleToggle}
                className="focus-run-pause flex size-[4.5rem] items-center justify-center rounded-full text-background transition-transform hover:scale-[1.03] active:scale-95"
                aria-label="Pause timer"
              >
                <Pause className="size-6 fill-current" />
              </button>
              {!isStopwatch ? (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                  aria-label="Skip to next phase"
                >
                  <SkipForward className="size-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSealStopwatch}
                  disabled={!canSealStopwatch}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground",
                    !canSealStopwatch && "pointer-events-none opacity-30",
                  )}
                  aria-label="Seal session"
                >
                  <CircleCheck className="size-4" />
                </button>
              )}
            </div>

            <div className="focus-run-dock flex w-full max-w-sm flex-col items-center gap-4">
              <FocusSounds compact />
              <FocusSettings
                dailyGoalMinutes={dailyGoalMinutes}
                onClockChange={handleClockChange}
                className="opacity-55 hover:opacity-100"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-[1] flex w-full flex-col gap-10">
          <div className="grid w-full gap-8 lg:grid-cols-2 lg:items-center lg:gap-8 xl:gap-10">
            <div className="flex min-w-0 flex-col gap-3">
              <div className="text-center lg:text-left">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Session
                </p>
                <p className="mt-1.5 flex min-h-5 items-baseline justify-center gap-2 text-sm text-muted-foreground lg:justify-start">
                  <span>
                    {isStopwatch
                      ? canContinue
                        ? "Continue session"
                        : "Open focus"
                      : canContinue
                        ? "Continue session"
                        : FOCUS_PRESETS[mode].label}
                  </span>
                  {!isStopwatch ? (
                    <span className="text-xs tabular-nums text-muted-foreground/70">
                      · {formatFocusMinutes(Math.round(durationSeconds / 60))}
                    </span>
                  ) : null}
                </p>
              </div>

              <div className="flex flex-col items-center gap-3 lg:items-start">
                <div className="relative flex size-[16rem] items-center justify-center sm:size-[18.5rem] lg:size-[22rem]">
                  <FocusClockFace
                    isRunning={isRunning}
                    isStopwatch={isStopwatch}
                    canContinue={canContinue}
                    mode={mode}
                    durationSeconds={durationSeconds}
                    subject={subject}
                    sessionLine={sessionLine}
                    pickupHint={pickupHint}
                    endedHint={endedHint}
                    runningHint={runningHint}
                    upcomingLabel={FOCUS_PRESETS[upcoming].label}
                    ringRadius={ringRadius}
                    ringCircumference={ringCircumference}
                    compactHints
                  />
                </div>

                {!isStopwatch ? (
                  <div
                    className="flex items-center gap-2"
                    aria-label={`${dots} of ${FOCUS_POMODOROS_PER_LONG_BREAK} toward a long break`}
                  >
                    {Array.from({
                      length: FOCUS_POMODOROS_PER_LONG_BREAK,
                    }).map((_, i) => (
                      <span
                        key={i}
                        className={cn(
                          "size-1.5 rounded-full transition-colors",
                          i < dots
                            ? "bg-foreground"
                            : "bg-muted-foreground/25",
                        )}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-5">
              <div className="text-center lg:text-left">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {canContinue ? "Paused" : "Ready"}
                </p>
                <p
                  className={cn(
                    "mt-1.5 font-medium leading-none tracking-tight text-foreground",
                    isStopwatch
                      ? "text-2xl sm:text-3xl"
                      : "text-2xl tabular-nums sm:text-3xl",
                  )}
                >
                  {isStopwatch
                    ? canContinue
                      ? "Continue"
                      : "Count up"
                    : formatFocusMinutes(Math.round(durationSeconds / 60))}
                </p>
                <p className="mt-1.5 text-sm leading-snug text-muted-foreground">
                  {isStopwatch
                    ? canContinue
                      ? pickupHint ?? "Pick up where you left off"
                      : "No timer · seal when ready"
                    : [
                        mode === "focus" ? "Focus" : FOCUS_PRESETS[mode].label,
                        activeProfile?.label ?? "Custom",
                      ].join(" · ")}
                </p>
              </div>

              <div className="space-y-3 text-center lg:text-left">
                {mode === "focus" || isStopwatch ? (
                  <>
                    <Input
                      value={intention}
                      onChange={(e) => setIntention(e.target.value)}
                      placeholder={
                        linkedTask
                          ? `Working on ${linkedTask.title}`
                          : "What deserves your focus?"
                      }
                      aria-label="What are you focusing on"
                      className="h-12 w-full rounded-2xl border-border/40 bg-transparent px-4 text-center text-lg font-medium tracking-tight shadow-none placeholder:font-normal placeholder:text-muted-foreground/70 focus-visible:ring-1 lg:text-left"
                    />
                    {tasks.length > 0 ? (
                      <select
                        value={linkedTaskId ?? ""}
                        onChange={(e) => {
                          const nextId = e.target.value || null;
                          setLinkedTaskId(nextId);
                          if (nextId && !intention.trim()) {
                            const task = tasks.find(
                              (item) => item.id === nextId,
                            );
                            if (task) setIntention(task.title);
                          }
                        }}
                        aria-label="Link a task"
                        className="h-9 w-full rounded-xl border border-transparent bg-muted/30 px-3 text-center text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus:border-border/50 focus:outline-none lg:text-left"
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
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {activeProfile ? activeProfile.label : "Custom"} · Space to
                    begin
                  </p>
                )}
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex size-12 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                    aria-label={
                      canSealStopwatch ? "Discard session" : "Reset timer"
                    }
                  >
                    <RotateCcw className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleToggle}
                    className="flex size-16 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-[1.03] active:scale-95"
                    aria-label={
                      canContinue
                        ? "Continue session"
                        : isStopwatch
                          ? "Start focus"
                          : "Begin session"
                    }
                  >
                    <Play className="size-6 fill-current pl-0.5" />
                  </button>
                  {!isStopwatch ? (
                    <button
                      type="button"
                      onClick={handleSkip}
                      className="flex size-12 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
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
                      )}
                      aria-label="Seal session"
                    >
                      <CircleCheck className="size-5" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {canContinue
                    ? "Continue · Space"
                    : isStopwatch
                      ? "Start focus · Space"
                      : mode === "focus"
                        ? "Begin session · Space"
                        : "Start break · Space"}
                </p>
                <FocusSettings
                  dailyGoalMinutes={dailyGoalMinutes}
                  onClockChange={handleClockChange}
                  align="start"
                  className="lg:justify-start"
                />
                <div className="w-full pt-2 lg:pt-3">
                  <FocusSounds />
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </section>
  );
}
