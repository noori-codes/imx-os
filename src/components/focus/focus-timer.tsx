"use client";

import {
  useEffect,
  useRef,
  useTransition,
  type CSSProperties,
} from "react";

import { useDocumentVisible } from "@/hooks/use-document-visible";
import { useRouter } from "next/navigation";
import { CircleCheck, Pause, Play, RotateCcw, SkipForward, Square } from "lucide-react";

import { logFocusSession, updateFocusSession } from "@/actions/focus";
import { completeTodayFocusBlocks } from "@/actions/calendar";
import { toggleTaskComplete } from "@/actions/tasks";
import { FocusClockFace } from "@/components/focus/focus-clock-face";
import { FocusSettings } from "@/components/focus/focus-settings";
import { FocusSounds } from "@/components/focus/focus-sounds";
import { showFocusSealToast } from "@/components/focus/focus-seal-toast";
import { confirm } from "@/components/ui/confirm-dialog";
import { BrandSelect } from "@/components/ui/brand-select";
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
import { focusSceneForTrack, stopFocusSound, useFocusSound } from "@/stores/focus-sound";
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
  goalHint,
  initialTaskId = null,
}: {
  tasks?: FocusLinkableTask[];
  focusMinutesToday?: number;
  dailyGoalMinutes?: number;
  goalHint?: string;
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
  const setClock = useFocusTimer((s) => s.setClock);
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
    setLinkedTaskId(task.id, task.title);
    if (!useFocusTimer.getState().intention.trim()) {
      setIntention(task.title);
    }
  }, [initialTaskId, tasks, isRunning, setLinkedTaskId, setIntention]);

  useEffect(() => {
    if (linkedTaskId && !tasks.some((task) => task.id === linkedTaskId)) {
      setLinkedTaskId(null);
      return;
    }
    if (
      linkedTask &&
      useFocusTimer.getState().linkedTaskTitle !== linkedTask.title
    ) {
      setLinkedTaskId(linkedTask.id, linkedTask.title);
    }
  }, [linkedTaskId, linkedTask, tasks, setLinkedTaskId]);

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
        if (currentMode === "focus") {
          await completeTodayFocusBlocks({ taskId });
        }
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
      await completeTodayFocusBlocks({ taskId });
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
    handleStopAndSave();
  }

  function handleDiscardSession() {
    const actual = isStopwatch
      ? useFocusTimer.getState().displaySeconds()
      : Math.max(0, durationSeconds - remainingSeconds);
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
    } else if (canContinueFocusSession(useFocusTimer.getState())) {
      const actual = durationSeconds - remainingSeconds;
      if (actual >= 5 && mode === "focus") {
        const startedAt = new Date(Date.now() - actual * 1000).toISOString();
        commitFocusSessionOptimistic(
          buildOptimisticFocusSession({
            mode: "focus",
            planned_seconds: durationSeconds,
            actual_seconds: actual,
            completed: false,
            note: intention,
            task_id: linkedTaskId,
            task_title: linkedTask?.title ?? null,
            started_at: startedAt,
          }),
        );
        void logFocusSession({
          mode: "focus",
          planned_seconds: durationSeconds,
          actual_seconds: actual,
          completed: false,
          note: intention,
          task_id: linkedTaskId,
        }).then(() => router.refresh());
      }
      reset();
    }

    setClock(next);
  }

  function handleStopAndSave() {
    stopFocusSound();
    if (isStopwatch) {
      if (isRunning) pause();
      sealStopwatch(useFocusTimer.getState().displaySeconds());
      return;
    }
    handleReset();
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
      handleDiscardSession();
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
        if (isStopwatch || canContinue || isRunning) {
          handleStopAndSave();
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

  const sessionProgress = isStopwatch
    ? Math.min(1, elapsedSeconds / 1500)
    : durationSeconds > 0
      ? Math.min(
          1,
          Math.max(0, (durationSeconds - remainingSeconds) / durationSeconds),
        )
      : 0;

  return (
    <section
      data-mode={mode}
      data-sound={soundPlaying ? soundId : undefined}
      data-focus-scene={focusSceneForTrack(soundId)}
      data-running={isRunning && pageVisible ? "true" : "false"}
      data-visible={pageVisible ? "true" : "false"}
      className={cn(
        "focus-stage group relative flex w-full flex-col overflow-hidden",
        isRunning || canContinue
          ? "h-full min-h-0 flex-1 items-center justify-center px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10"
          : "px-0 py-0",
      )}
      id="focus-timer"
      style={
        isRunning || canContinue
          ? ({
              ["--focus-progress" as string]: sessionProgress.toFixed(3),
            } as CSSProperties)
          : undefined
      }
    >
      {/* Idle wash lives on .focus-studio; run room uses ink layers only */}
      <div className="focus-run-rail" aria-hidden />
      <div className="focus-run-mist" aria-hidden />
      <div className="focus-run-vignette" aria-hidden />
      <div className="focus-stage-grain" aria-hidden />
      <div className="focus-stage-glow-soft" aria-hidden />
      <div className="focus-stage-glow" aria-hidden />

      {isRunning || canContinue ? (
        <div className="focus-run relative z-1 mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(17.5rem,20rem)] lg:grid-rows-[auto_auto_auto] lg:items-center lg:gap-x-14 lg:gap-y-0 xl:gap-x-16">
          <div className="focus-run-status flex items-center justify-center gap-2.5 lg:col-start-1 lg:row-start-1 lg:justify-self-center lg:pb-6">
            {isRunning ? (
              <span className="focus-live-dot" aria-hidden />
            ) : null}
            <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
              {isRunning ? runningLabel : "Paused"}
            </p>
          </div>

          <div className="focus-run-timer-core relative flex items-center justify-center lg:col-start-1 lg:row-start-2">
            <div className="focus-clock-jewel relative flex size-[min(68vw,17rem)] items-center justify-center sm:size-[19rem] lg:size-[21rem]">
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

          <div className="focus-run-meta mt-5 flex flex-col items-center gap-3 sm:mt-6 lg:col-start-1 lg:row-start-3 lg:mt-0 lg:pt-6">
            {runningDetail ? (
              <p className="max-w-[22rem] truncate text-[13px] tracking-[0.04em] text-foreground/75">
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
          </div>

          <aside className="focus-run-side mx-auto flex w-full max-w-sm items-center lg:col-start-2 lg:row-start-2 lg:mx-0 lg:max-w-none lg:self-stretch">
            <div className="focus-run-side-card flex h-full w-full flex-col gap-5 rounded-[1.35rem] border border-border/40 bg-background/45 px-5 py-5 backdrop-blur-sm sm:gap-6 sm:px-6 sm:py-6">
              <div className="focus-run-controls flex items-center justify-center gap-4 sm:gap-5">
                <button
                  type="button"
                  onClick={handleDiscardSession}
                  className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                  aria-label="Discard session"
                  title="Discard without saving"
                >
                  <RotateCcw className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={handleToggle}
                  className="focus-run-pause flex size-[4.5rem] items-center justify-center rounded-full text-background transition-transform hover:scale-[1.03] active:scale-95"
                  aria-label={isRunning ? "Pause timer" : "Resume timer"}
                >
                  {isRunning ? (
                    <Pause className="size-6 fill-current" />
                  ) : (
                    <Play className="size-6 fill-current" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleStopAndSave}
                  disabled={isStopwatch ? !canSealStopwatch : false}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground",
                    isStopwatch &&
                      !canSealStopwatch &&
                      "pointer-events-none opacity-30",
                  )}
                  aria-label="Stop and save"
                  title="Stop and save"
                >
                  {isStopwatch ? (
                    <Square className="size-4 fill-current" />
                  ) : (
                    <CircleCheck className="size-4" />
                  )}
                </button>
              </div>

              <div className="h-px w-full bg-border/40" aria-hidden />

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Room
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-foreground">
                    {isStopwatch
                      ? "Count up"
                      : [
                          FOCUS_PRESETS[mode].label,
                          activeProfile?.label ?? "Custom",
                        ].join(" · ")}
                  </p>
                </div>
                <FocusSettings
                  dailyGoalMinutes={dailyGoalMinutes}
                  onClockChange={handleClockChange}
                  iconOnly
                  className="shrink-0"
                />
              </div>

              <div className="h-px w-full bg-border/40" aria-hidden />

              <FocusSounds embedded />
            </div>
          </aside>
        </div>
      ) : (
        <div className="focus-launch relative z-1 w-full overflow-hidden rounded-[1.75rem] imx-surface">
          <div className="focus-launch-vignette" aria-hidden />
          <div className="focus-launch-glow" aria-hidden />
          <div className="relative grid items-center gap-8 p-5 sm:p-7 lg:grid-cols-2 lg:gap-12 lg:p-8">
            {/* Visual column */}
            <div className="flex flex-col items-center gap-5 lg:items-start">
              <div className="w-full text-center lg:text-left">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {canContinue ? "Paused" : "Focus studio"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {canContinue ? "Continue" : "Begin"}
                </h2>
                <p className="mt-1.5 max-w-sm text-sm text-muted-foreground lg:mx-0">
                  {goalHint
                    ? `${goalHint}.`
                    : isStopwatch
                      ? canContinue
                        ? "Pick up where you left off."
                        : "Open focus · no countdown."
                      : [
                          FOCUS_PRESETS[mode].label,
                          activeProfile?.label ?? "Custom",
                          formatFocusMinutes(Math.round(durationSeconds / 60)),
                        ].join(" · ")}
                </p>
              </div>

              <div className="relative mx-auto flex size-[min(68vw,17rem)] items-center justify-center sm:size-[19rem] lg:mx-0 lg:size-[21rem]">
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
                  className="flex items-center justify-center gap-2 lg:justify-start"
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

            {/* Action column */}
            <div className="flex min-w-0 flex-col gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="flex flex-1 gap-1 rounded-full bg-muted/35 p-1"
                  role="tablist"
                  aria-label="Clock style"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={!isStopwatch}
                    onClick={() => handleClockChange("down")}
                    className={cn(
                      "min-w-0 flex-1 rounded-full px-3 py-2 text-xs font-medium transition-colors sm:text-sm",
                      !isStopwatch
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Timed
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isStopwatch}
                    onClick={() => handleClockChange("up")}
                    className={cn(
                      "min-w-0 flex-1 rounded-full px-3 py-2 text-xs font-medium transition-colors sm:text-sm",
                      isStopwatch
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Count up
                  </button>
                </div>
                <FocusSettings
                  dailyGoalMinutes={dailyGoalMinutes}
                  onClockChange={handleClockChange}
                  iconOnly
                  className="shrink-0"
                />
              </div>

              {!isStopwatch ? (
                <div className="grid grid-cols-3 gap-1.5">
                  {FOCUS_PROFILES.map((profile) => {
                    const active = profileId === profile.id;
                    return (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => applyProfile(profile.id)}
                        className={cn(
                          "rounded-xl px-2.5 py-2 text-left transition-colors",
                          active
                            ? "bg-foreground text-background"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                        )}
                        aria-pressed={active}
                      >
                        <span className="block text-xs font-medium sm:text-sm">
                          {profile.label}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 block text-[10px] tabular-nums sm:text-[11px]",
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
              ) : null}

              {mode === "focus" || isStopwatch ? (
                <div className="space-y-2">
                  <Input
                    value={intention}
                    onChange={(e) => setIntention(e.target.value)}
                    placeholder="What deserves your focus?"
                    aria-label="What are you focusing on"
                    data-imx-capture
                    className="h-11 w-full rounded-xl border-border/50 bg-muted/40 px-4 text-sm font-medium tracking-tight shadow-none placeholder:font-normal focus-visible:ring-1"
                  />
                  {tasks.length > 0 ? (
                    <BrandSelect
                      value={linkedTaskId ?? ""}
                      aria-label="Link a task"
                      className="h-9 w-full border-border/40 bg-muted/30"
                      placeholder="Optional · link an open task"
                      options={[
                        { value: "", label: "Optional · link an open task" },
                        ...tasks.map((task) => ({
                          value: task.id,
                          label: task.context
                            ? `${task.title} · ${task.context}`
                            : task.title,
                        })),
                      ]}
                      onValueChange={(nextId) => {
                        const id = nextId || null;
                        if (!id) {
                          setLinkedTaskId(null);
                          return;
                        }
                        const task = tasks.find((item) => item.id === id);
                        setLinkedTaskId(id, task?.title ?? null);
                        if (task && !intention.trim()) {
                          setIntention(task.title);
                        }
                      }}
                    />
                  ) : null}
                </div>
              ) : null}

              <FocusSounds compact />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={
                    canSealStopwatch ? "Discard session" : "Reset timer"
                  }
                >
                  <RotateCcw className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={handleToggle}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-transform hover:scale-[1.01] active:scale-[0.99]"
                  aria-label={
                    canContinue
                      ? "Continue session"
                      : isStopwatch
                        ? "Start focus"
                        : "Begin session"
                  }
                >
                  <Play className="size-4 fill-current" />
                  {canContinue
                    ? "Continue"
                    : isStopwatch
                      ? "Start"
                      : mode === "focus"
                        ? "Begin"
                        : "Start break"}
                </button>
                {!isStopwatch ? (
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
                      "flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                      !canSealStopwatch && "pointer-events-none opacity-30",
                    )}
                    aria-label="Seal session"
                  >
                    <CircleCheck className="size-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
