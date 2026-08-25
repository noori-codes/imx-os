"use client";

import { create } from "zustand";

import type {
  FocusClock,
  FocusMode,
  FocusProfileId,
  FocusSession,
} from "@/types/focus";
import {
  canContinueFocusSession as canContinueFocusSessionFrom,
  canContinueLoggedSession as canContinueLoggedSessionFrom,
  sessionInProgress as sessionInProgressFrom,
} from "@/lib/focus-continue";
import {
  FOCUS_CLOCK_DEFAULT,
  FOCUS_CLOCK_KEY,
  FOCUS_MAX_SECONDS,
  FOCUS_POMODOROS_PER_LONG_BREAK,
  FOCUS_PROFILE_DEFAULT,
  FOCUS_PROFILE_KEY,
  getFocusProfile,
  matchFocusProfile,
} from "@/types/focus";

const AUTO_START_KEY = "imx-focus-auto-start";

type FocusTimerState = {
  mode: FocusMode;
  clock: FocusClock;
  durationSeconds: number;
  remainingSeconds: number;
  elapsedSeconds: number;
  isRunning: boolean;
  startedAt: number | null;
  sessionStartedAt: number | null;
  endsAt: number | null;
  tickMs: number;
  lastDisplaySecond: number;
  sealPulse: { startedAt: string; seconds: number } | null;
  completedFocusCount: number;
  autoStartNext: boolean;
  intention: string;
  linkedTaskId: string | null;
  profileId: FocusProfileId | null;
  lastFocusSeconds: number;
  lastShortBreakSeconds: number;
  lastLongBreakSeconds: number;
  progressBaseSeconds: number;
  continuedSessionId: string | null;
  continuedMergeIds: string[];
  setMode: (mode: FocusMode) => void;
  setClock: (clock: FocusClock) => void;
  setDuration: (seconds: number) => void;
  setIntention: (intention: string) => void;
  setLinkedTaskId: (taskId: string | null) => void;
  setAutoStartNext: (value: boolean) => void;
  applyProfile: (profileId: FocusProfileId) => void;
  hydrateProfile: () => void;
  start: (seconds?: number) => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  advance: (reason: "complete" | "skip") => void;
  syncFromClock: () => boolean;
  tick: () => boolean;
  complete: () => void;
  displaySeconds: () => number;
  liveElapsedSeconds: () => number;
  pulseSeal: (mark: { startedAt: string; seconds: number }) => void;
  clearSealPulse: () => void;
  optimisticLog: FocusSession | null;
  pushOptimisticLog: (session: FocusSession) => void;
  clearOptimisticLog: () => void;
  continueFromLoggedSession: (
    session: Pick<
      FocusSession,
      | "id"
      | "actual_seconds"
      | "note"
      | "task_id"
      | "mode"
      | "started_at"
    >,
    absorb?: Pick<FocusSession, "id" | "actual_seconds" | "started_at">[],
  ) => void;
};

export function sessionInProgress(
  state: Pick<
    FocusTimerState,
    | "clock"
    | "mode"
    | "elapsedSeconds"
    | "isRunning"
    | "sessionStartedAt"
    | "durationSeconds"
    | "remainingSeconds"
    | "progressBaseSeconds"
  >,
) {
  return sessionInProgressFrom(state);
}

export function canContinueFocusSession(
  state: Pick<
    FocusTimerState,
    | "clock"
    | "mode"
    | "elapsedSeconds"
    | "isRunning"
    | "sessionStartedAt"
    | "durationSeconds"
    | "remainingSeconds"
    | "progressBaseSeconds"
  >,
) {
  return canContinueFocusSessionFrom(state);
}

function remainingFromEndsAt(endsAt: number | null, fallback: number) {
  if (!endsAt) return fallback;
  return Math.max(0, Math.round((endsAt - Date.now()) / 1000));
}

function elapsedFromStartedAt(startedAt: number | null, base: number) {
  if (!startedAt) return base;
  return Math.min(
    FOCUS_MAX_SECONDS,
    base + Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
  );
}

function clampSeconds(seconds: number) {
  return Math.max(60, Math.min(FOCUS_MAX_SECONDS, Math.round(seconds)));
}

function durationForMode(
  mode: FocusMode,
  state: Pick<
    FocusTimerState,
    "lastFocusSeconds" | "lastShortBreakSeconds" | "lastLongBreakSeconds"
  >,
) {
  if (mode === "focus") return state.lastFocusSeconds;
  if (mode === "short_break") return state.lastShortBreakSeconds;
  return state.lastLongBreakSeconds;
}

function syncProfileId(state: {
  lastFocusSeconds: number;
  lastShortBreakSeconds: number;
  lastLongBreakSeconds: number;
}) {
  return matchFocusProfile({
    focus: Math.round(state.lastFocusSeconds / 60),
    short_break: Math.round(state.lastShortBreakSeconds / 60),
    long_break: Math.round(state.lastLongBreakSeconds / 60),
  });
}

export function nextFocusMode(
  mode: FocusMode,
  completedFocusCount: number,
  reason: "complete" | "skip",
): FocusMode {
  if (mode !== "focus") return "focus";
  if (
    reason === "complete" &&
    completedFocusCount > 0 &&
    completedFocusCount % FOCUS_POMODOROS_PER_LONG_BREAK === 0
  ) {
    return "long_break";
  }
  return "short_break";
}

const classic = getFocusProfile(FOCUS_PROFILE_DEFAULT);

export const useFocusTimer = create<FocusTimerState>((set, get) => ({
  mode: "focus",
  clock: FOCUS_CLOCK_DEFAULT,
  durationSeconds: classic.focus * 60,
  remainingSeconds: classic.focus * 60,
  elapsedSeconds: 0,
  isRunning: false,
  startedAt: null,
  sessionStartedAt: null,
  endsAt: null,
  tickMs: 0,
  lastDisplaySecond: 0,
  sealPulse: null,
  optimisticLog: null,
  completedFocusCount: 0,
  autoStartNext: false,
  intention: "",
  linkedTaskId: null,
  profileId: FOCUS_PROFILE_DEFAULT,
  lastFocusSeconds: classic.focus * 60,
  lastShortBreakSeconds: classic.short_break * 60,
  lastLongBreakSeconds: classic.long_break * 60,
  progressBaseSeconds: 0,
  continuedSessionId: null,
  continuedMergeIds: [],

  displaySeconds: () => {
    const current = get();
    if (current.clock === "up") {
      return elapsedFromStartedAt(current.startedAt, current.elapsedSeconds);
    }
    return remainingFromEndsAt(current.endsAt, current.remainingSeconds);
  },

  liveElapsedSeconds: () => {
    const current = get();
    if (current.clock !== "up") return 0;
    return elapsedFromStartedAt(current.startedAt, current.elapsedSeconds);
  },

  pulseSeal: (mark) => set({ sealPulse: mark }),

  clearSealPulse: () => set({ sealPulse: null }),

  pushOptimisticLog: (session) => set({ optimisticLog: session }),

  clearOptimisticLog: () => set({ optimisticLog: null }),

  setMode: (mode) => {
    const current = get();
    if (current.isRunning) return;
    const durationSeconds = durationForMode(mode, current);
    set({
      mode,
      durationSeconds,
      remainingSeconds: durationSeconds,
      elapsedSeconds: 0,
      progressBaseSeconds: 0,
      continuedSessionId: null,
      continuedMergeIds: [],
      isRunning: false,
      startedAt: null,
      sessionStartedAt: null,
      endsAt: null,
    });
  },

  setClock: (clock) => {
    const current = get();
    if (current.isRunning) return;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FOCUS_CLOCK_KEY, clock);
    }
    if (clock === "up") {
      set({
        clock,
        mode: "focus",
        elapsedSeconds: 0,
        progressBaseSeconds: 0,
        continuedSessionId: null,
        continuedMergeIds: [],
        remainingSeconds: current.lastFocusSeconds,
        durationSeconds: current.lastFocusSeconds,
        isRunning: false,
        startedAt: null,
        sessionStartedAt: null,
        endsAt: null,
        lastDisplaySecond: 0,
      });
      return;
    }
    const durationSeconds = durationForMode(current.mode, current);
    set({
      clock,
      durationSeconds,
      remainingSeconds: durationSeconds,
      elapsedSeconds: 0,
      progressBaseSeconds: 0,
      continuedSessionId: null,
      continuedMergeIds: [],
      isRunning: false,
      startedAt: null,
      sessionStartedAt: null,
      endsAt: null,
    });
  },

  setDuration: (seconds) => {
    const current = get();
    if (current.isRunning) return;
    if (current.clock === "up") return;
    const durationSeconds = clampSeconds(seconds);
    const next = {
      durationSeconds,
      remainingSeconds: durationSeconds,
      startedAt: null as number | null,
      endsAt: null as number | null,
      lastFocusSeconds:
        current.mode === "focus" ? durationSeconds : current.lastFocusSeconds,
      lastShortBreakSeconds:
        current.mode === "short_break"
          ? durationSeconds
          : current.lastShortBreakSeconds,
      lastLongBreakSeconds:
        current.mode === "long_break"
          ? durationSeconds
          : current.lastLongBreakSeconds,
    };
    const profileId = syncProfileId(next);
    if (typeof window !== "undefined") {
      if (profileId) {
        window.localStorage.setItem(FOCUS_PROFILE_KEY, profileId);
      } else {
        window.localStorage.removeItem(FOCUS_PROFILE_KEY);
      }
    }
    set({ ...next, profileId });
  },

  setIntention: (intention) => set({ intention }),

  setLinkedTaskId: (taskId) => set({ linkedTaskId: taskId }),

  setAutoStartNext: (value) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUTO_START_KEY, value ? "1" : "0");
    }
    set({ autoStartNext: value });
  },

  applyProfile: (profileId) => {
    const current = get();
    if (current.isRunning) return;
    const profile = getFocusProfile(profileId);
    const lastFocusSeconds = profile.focus * 60;
    const lastShortBreakSeconds = profile.short_break * 60;
    const lastLongBreakSeconds = profile.long_break * 60;
    const durationSeconds = durationForMode(current.mode, {
      lastFocusSeconds,
      lastShortBreakSeconds,
      lastLongBreakSeconds,
    });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FOCUS_PROFILE_KEY, profileId);
    }
    set({
      profileId,
      lastFocusSeconds,
      lastShortBreakSeconds,
      lastLongBreakSeconds,
      durationSeconds,
      remainingSeconds: durationSeconds,
      elapsedSeconds: 0,
      startedAt: null,
      sessionStartedAt: null,
      endsAt: null,
      isRunning: false,
    });
  },

  hydrateProfile: () => {
    if (typeof window === "undefined") return;
    const storedClock = window.localStorage.getItem(FOCUS_CLOCK_KEY);
    const clock: FocusClock =
      storedClock === "up" || storedClock === "down"
        ? storedClock
        : FOCUS_CLOCK_DEFAULT;
    const stored = window.localStorage.getItem(FOCUS_PROFILE_KEY);
    const profileId =
      stored === "classic" || stored === "deep" || stored === "quick"
        ? stored
        : FOCUS_PROFILE_DEFAULT;
    get().applyProfile(profileId);
    if (clock !== get().clock) {
      get().setClock(clock);
    }
  },

  start: (seconds) => {
    const current = get();
    if (current.isRunning) return;

    const now = Date.now();

    if (current.clock === "up") {
      if (current.elapsedSeconds >= FOCUS_MAX_SECONDS) return;
      set({
        mode: "focus",
        isRunning: true,
        startedAt: now,
        endsAt: null,
        sessionStartedAt: current.sessionStartedAt ?? now,
        lastDisplaySecond: current.elapsedSeconds,
      });
      return;
    }

    const durationSeconds = seconds
      ? clampSeconds(seconds)
      : current.durationSeconds;
    const remainingSeconds =
      seconds || current.remainingSeconds <= 0
        ? durationSeconds
        : current.remainingSeconds;

    if (remainingSeconds <= 0) return;

    const lastFocusSeconds =
      current.mode === "focus" ? durationSeconds : current.lastFocusSeconds;
    const lastShortBreakSeconds =
      current.mode === "short_break"
        ? durationSeconds
        : current.lastShortBreakSeconds;
    const lastLongBreakSeconds =
      current.mode === "long_break"
        ? durationSeconds
        : current.lastLongBreakSeconds;

    set({
      durationSeconds,
      remainingSeconds,
      elapsedSeconds: 0,
      isRunning: true,
      startedAt: now,
      endsAt: now + remainingSeconds * 1000,
      lastDisplaySecond: remainingSeconds,
      lastFocusSeconds,
      lastShortBreakSeconds,
      lastLongBreakSeconds,
      profileId: syncProfileId({
        lastFocusSeconds,
        lastShortBreakSeconds,
        lastLongBreakSeconds,
      }),
    });
  },

  pause: () => {
    const current = get();
    if (!current.isRunning) return;

    if (current.clock === "up") {
      const elapsed = elapsedFromStartedAt(
        current.startedAt,
        current.elapsedSeconds,
      );
      set({
        isRunning: false,
        elapsedSeconds: elapsed,
        startedAt: null,
        endsAt: null,
        lastDisplaySecond: elapsed,
      });
      return;
    }

    set({
      isRunning: false,
      remainingSeconds: remainingFromEndsAt(
        current.endsAt,
        current.remainingSeconds,
      ),
      endsAt: null,
      startedAt: null,
    });
  },

  reset: () => {
    const current = get();
    if (current.clock === "up") {
      set({
        elapsedSeconds: 0,
        progressBaseSeconds: 0,
        continuedSessionId: null,
        continuedMergeIds: [],
        isRunning: false,
        startedAt: null,
        sessionStartedAt: null,
        endsAt: null,
        lastDisplaySecond: 0,
      });
      return;
    }
    set({
      remainingSeconds: current.durationSeconds,
      elapsedSeconds: 0,
      progressBaseSeconds: 0,
      continuedSessionId: null,
      continuedMergeIds: [],
      isRunning: false,
      startedAt: null,
      sessionStartedAt: null,
      endsAt: null,
    });
  },

  continueFromLoggedSession: (session, absorb = []) => {
    const current = get();
    if (!canContinueLoggedSessionFrom(session, current.isRunning)) return;

    const extras = absorb.filter((item) => item.id !== session.id);
    const carried = Math.max(
      0,
      Math.min(
        FOCUS_MAX_SECONDS,
        session.actual_seconds +
          extras.reduce((sum, item) => sum + item.actual_seconds, 0),
      ),
    );

    const earliestStart = [session, ...extras].reduce((earliest, item) => {
      const time = new Date(item.started_at).getTime();
      return time < earliest ? time : earliest;
    }, new Date(session.started_at).getTime());

    set({
      clock: "up",
      mode: "focus",
      elapsedSeconds: carried,
      progressBaseSeconds: carried,
      continuedSessionId: session.id,
      continuedMergeIds: extras.map((item) => item.id),
      isRunning: false,
      startedAt: null,
      sessionStartedAt: earliestStart,
      endsAt: null,
      lastDisplaySecond: carried,
      intention: session.note ?? "",
      linkedTaskId: session.task_id ?? null,
      remainingSeconds: current.lastFocusSeconds,
      durationSeconds: current.lastFocusSeconds,
    });

    if (typeof window !== "undefined") {
      window.localStorage.setItem(FOCUS_CLOCK_KEY, "up");
    }

    get().start();
  },

  skip: () => {
    if (get().clock === "up") return;
    get().advance("skip");
  },

  advance: (reason) => {
    if (get().clock === "up") return;
    const { mode, completedFocusCount } = get();
    const next = nextFocusMode(mode, completedFocusCount, reason);
    get().setMode(next);
  },

  syncFromClock: () => {
    const current = get();
    if (!current.isRunning) return false;

    if (current.clock === "up") {
      const elapsed = elapsedFromStartedAt(
        current.startedAt,
        current.elapsedSeconds,
      );
      if (elapsed >= FOCUS_MAX_SECONDS) {
        set({
          elapsedSeconds: FOCUS_MAX_SECONDS,
          isRunning: false,
          startedAt: null,
          sessionStartedAt: null,
          endsAt: null,
          lastDisplaySecond: FOCUS_MAX_SECONDS,
        });
        return true;
      }
      if (elapsed !== current.lastDisplaySecond) {
        set({ tickMs: Date.now(), lastDisplaySecond: elapsed });
      }
      return false;
    }

    if (!current.endsAt) return false;

    const remaining = remainingFromEndsAt(
      current.endsAt,
      current.remainingSeconds,
    );
    if (remaining <= 0) {
      get().complete();
      return true;
    }

    // Display-only tick — avoid rewriting remainingSeconds every second
    // so FocusTimer / sky don't re-render at 1 Hz.
    if (remaining !== current.lastDisplaySecond) {
      set({ tickMs: Date.now(), lastDisplaySecond: remaining });
    }
    return false;
  },

  tick: () => get().syncFromClock(),

  complete: () => {
    const { mode, isRunning, remainingSeconds, completedFocusCount, clock } =
      get();
    if (clock === "up") return;
    if (!isRunning && remainingSeconds === 0) return;

    set({
      remainingSeconds: 0,
      isRunning: false,
      startedAt: null,
      endsAt: null,
      completedFocusCount:
        mode === "focus" ? completedFocusCount + 1 : completedFocusCount,
    });
  },
}));
