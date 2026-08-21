"use client";

import { create } from "zustand";

import type { FocusMode, FocusProfileId } from "@/types/focus";
import {
  FOCUS_MAX_SECONDS,
  FOCUS_POMODOROS_PER_LONG_BREAK,
  FOCUS_PRESETS,
  FOCUS_PROFILE_DEFAULT,
  FOCUS_PROFILE_KEY,
  getFocusProfile,
  matchFocusProfile,
} from "@/types/focus";

const AUTO_START_KEY = "imx-focus-auto-start";

type FocusTimerState = {
  mode: FocusMode;
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  startedAt: number | null;
  endsAt: number | null;
  completedFocusCount: number;
  autoStartNext: boolean;
  intention: string;
  linkedTaskId: string | null;
  profileId: FocusProfileId | null;
  lastFocusSeconds: number;
  lastShortBreakSeconds: number;
  lastLongBreakSeconds: number;
  setMode: (mode: FocusMode) => void;
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
};

function remainingFromEndsAt(endsAt: number | null, fallback: number) {
  if (!endsAt) return fallback;
  return Math.max(0, Math.round((endsAt - Date.now()) / 1000));
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
  durationSeconds: classic.focus * 60,
  remainingSeconds: classic.focus * 60,
  isRunning: false,
  startedAt: null,
  endsAt: null,
  completedFocusCount: 0,
  autoStartNext: false,
  intention: "",
  linkedTaskId: null,
  profileId: FOCUS_PROFILE_DEFAULT,
  lastFocusSeconds: classic.focus * 60,
  lastShortBreakSeconds: classic.short_break * 60,
  lastLongBreakSeconds: classic.long_break * 60,

  setMode: (mode) => {
    const durationSeconds = durationForMode(mode, get());
    set({
      mode,
      durationSeconds,
      remainingSeconds: durationSeconds,
      isRunning: false,
      startedAt: null,
      endsAt: null,
    });
  },

  setDuration: (seconds) => {
    const current = get();
    if (current.isRunning) return;
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
      startedAt: null,
      endsAt: null,
      isRunning: false,
    });
  },

  hydrateProfile: () => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(FOCUS_PROFILE_KEY);
    const profileId =
      stored === "classic" || stored === "deep" || stored === "quick"
        ? stored
        : FOCUS_PROFILE_DEFAULT;
    get().applyProfile(profileId);
  },

  start: (seconds) => {
    const current = get();
    if (current.isRunning) return;

    const durationSeconds = seconds
      ? clampSeconds(seconds)
      : current.durationSeconds;
    const remainingSeconds =
      seconds || current.remainingSeconds <= 0
        ? durationSeconds
        : current.remainingSeconds;

    if (remainingSeconds <= 0) return;

    const now = Date.now();
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
      isRunning: true,
      startedAt: now,
      endsAt: now + remainingSeconds * 1000,
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
    const { isRunning, endsAt, remainingSeconds } = get();
    if (!isRunning) return;
    set({
      isRunning: false,
      remainingSeconds: remainingFromEndsAt(endsAt, remainingSeconds),
      endsAt: null,
    });
  },

  reset: () => {
    const { durationSeconds } = get();
    set({
      remainingSeconds: durationSeconds,
      isRunning: false,
      startedAt: null,
      endsAt: null,
    });
  },

  skip: () => {
    get().advance("skip");
  },

  advance: (reason) => {
    const { mode, completedFocusCount } = get();
    const next = nextFocusMode(mode, completedFocusCount, reason);
    get().setMode(next);
  },

  syncFromClock: () => {
    const { isRunning, endsAt, remainingSeconds } = get();
    if (!isRunning || !endsAt) return false;

    const remaining = remainingFromEndsAt(endsAt, remainingSeconds);
    if (remaining <= 0) {
      get().complete();
      return true;
    }

    if (remaining !== remainingSeconds) {
      set({ remainingSeconds: remaining });
    }
    return false;
  },

  tick: () => get().syncFromClock(),

  complete: () => {
    const { mode, isRunning, remainingSeconds, completedFocusCount } = get();
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
