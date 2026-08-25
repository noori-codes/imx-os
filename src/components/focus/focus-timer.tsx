"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { useDocumentVisible } from "@/hooks/use-document-visible";
import { useRouter } from "next/navigation";
import { ChevronDown, CircleCheck, CircleHelp, Pause, Play, RotateCcw, SkipForward } from "lucide-react";

import { logFocusSession, updateFocusSession } from "@/actions/focus";
import { toggleTaskComplete } from "@/actions/tasks";
import { FocusSounds } from "@/components/focus/focus-sounds";
import { FocusClockFace } from "@/components/focus/focus-clock-face";
import { showFocusSealToast } from "@/components/focus/focus-seal-toast";
import { confirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import {
  notifyFocusPhase,
  playFocusChime,
  requestFocusNotifyPermission,
} from "@/lib/focus-alerts";
import {
  celebrateDailyGoalIfCrossed,
  readFocusDailyGoalMinutes,
} from "@/lib/focus-celebrate";
import {
  buildPickupHint,
  continueSubject,
} from "@/lib/focus-continue";
import { cn } from "@/lib/utils";
import { stopFocusSound } from "@/stores/focus-sound";
import { nextFocusMode, useFocusTimer, canContinueFocusSession } from "@/stores/focus-timer";
import {
  BREAK_DURATION_PRESETS,
  FOCUS_DURATION_PRESETS,
  FOCUS_MAX_SECONDS,
  FOCUS_POMODOROS_PER_LONG_BREAK,
  FOCUS_PRESETS,
  FOCUS_PROFILES,
  formatFocusClock,
  buildOptimisticFocusSession,
  type FocusClock,
  type FocusMode,
} from "@/types/focus";
import type { FocusLinkableTask } from "@/types/task";

const MODES: FocusMode[] = ["focus", "short_break", "long_break"];
const CLOCKS: { id: FocusClock; label: string; hint: string }[] = [
  { id: "down", label: "Countdown", hint: "Timed blocks" },
  { id: "up", label: "Count up", hint: "Until you stop" },
];

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
  const [customHours, setCustomHours] = useState("");
  const [customMinutes, setCustomMinutes] = useState("");
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

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

      startTransition(async () => {
        if (currentMode === "focus") {
          useFocusTimer.getState().pushOptimisticLog(
            buildOptimisticFocusSession({
              mode: currentMode,
              planned_seconds: planned,
              actual_seconds: planned,
              completed: true,
              note,
              task_id: taskId,
              task_title: linkedTask?.title ?? null,
              started_at: new Date(Date.now() - planned * 1000).toISOString(),
            }),
          );
        }
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
      const beforeMinutes = todayMinutesRef.current;
      const todayMinutes = beforeMinutes + addedMinutes;
      if (currentMode === "focus") {
        todayMinutesRef.current = todayMinutes;
        useFocusTimer.getState().pulseSeal({
          startedAt: new Date(Date.now() - planned * 1000).toISOString(),
          seconds: planned,
        });
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

        const goalCrossed = celebrateDailyGoalIfCrossed({
          beforeMinutes,
          afterMinutes: todayMinutes,
          goalMinutes: readFocusDailyGoalMinutes(dailyGoalMinutes),
          onMarkDone: markDone,
        });

        if (!goalCrossed) {
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

    useFocusTimer.getState().pushOptimisticLog(
      buildOptimisticFocusSession({
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
      }),
    );

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
    useFocusTimer.getState().pulseSeal({
      startedAt: sealStartedAt,
      seconds: isContinuation ? incremental : actual,
    });

    const beforeMinutes = todayMinutesRef.current;
    const todayMinutes = beforeMinutes + addedMinutes;
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

    const goalCrossed = celebrateDailyGoalIfCrossed({
      beforeMinutes,
      afterMinutes: todayMinutes,
      goalMinutes: readFocusDailyGoalMinutes(dailyGoalMinutes),
      onMarkDone: markDone,
    });

    if (!goalCrossed) {
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
    const custom = isStopwatch ? undefined : secondsFromCustom();
    void requestFocusNotifyPermission();
    start(custom ?? undefined);
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
        if (currentMode === "focus") {
          useFocusTimer.getState().pushOptimisticLog(
            buildOptimisticFocusSession({
              mode: currentMode,
              planned_seconds: planned,
              actual_seconds: actual,
              completed: false,
              note,
              task_id: taskId,
              task_title: linkedTask?.title ?? null,
              started_at: new Date(Date.now() - actual * 1000).toISOString(),
            }),
          );
        }
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
        if (currentMode === "focus") {
          useFocusTimer.getState().pushOptimisticLog(
            buildOptimisticFocusSession({
              mode: currentMode,
              planned_seconds: planned,
              actual_seconds: actual,
              completed: false,
              note,
              task_id: taskId,
              task_title: linkedTask?.title ?? null,
              started_at: new Date(Date.now() - actual * 1000).toISOString(),
            }),
          );
        }
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

      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShortcutsOpen((open) => !open);
        return;
      }

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
      className="focus-stage group relative flex h-full min-h-[28rem] flex-col overflow-hidden px-2 py-6 sm:min-h-[32rem] sm:px-4 sm:py-8 lg:min-h-[34rem] lg:py-9"
      id="focus-timer"
    >
      <div className="focus-stage-glow" aria-hidden />

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
            isRunning ? "mt-3 sm:mt-4 lg:mt-6" : "mt-6 sm:mt-8",
          )}
        >
          <div
            className={cn(
              "relative flex items-center justify-center",
              isRunning
                ? "size-[min(82vw,19rem)] sm:size-[min(88vw,22rem)] lg:size-[24rem]"
                : "size-[15.5rem] sm:size-[17.5rem] lg:size-[19.5rem]",
            )}
          >
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
            />
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
          <p className="mt-3 text-xs text-muted-foreground">
            {isRunning
              ? "Pause anytime · R seals · ↺ discards"
              : canContinue
                ? "Continue · R seals · Space · ↺ discards"
                : elapsedSeconds > 0
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
                canSealStopwatch ? "Discard session" : "Reset timer"
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
          <button
            type="button"
            onClick={() => setShortcutsOpen((open) => !open)}
            className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground/80 transition-colors hover:text-foreground"
            aria-expanded={shortcutsOpen}
          >
            <CircleHelp className="size-3.5" />
            Shortcuts
          </button>
          {shortcutsOpen ? (
            <p className="mt-1.5 text-center text-[11px] leading-relaxed text-muted-foreground">
              Space · play/pause
              <br />
              {isStopwatch ? "R · seal · ↺ discard" : "S · skip · R · reset"}
            </p>
          ) : null}
        </div>

        {!isRunning ? (
          <details className="group/setup mt-5 w-full max-w-md sm:mt-6">
            <summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
              <span className="tabular-nums max-sm:text-xs">Setup · {setupSummary}</span>
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
