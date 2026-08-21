"use client";

import { create } from "zustand";

import type { FocusMode } from "@/types/focus";
import {
  FOCUS_MAX_SECONDS,
  FOCUS_POMODOROS_PER_LONG_BREAK,
  FOCUS_PRESETS,
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
  lastFocusSeconds: number;
  setMode: (mode: FocusMode) => void;
  setDuration: (seconds: number) => void;
  setIntention: (intention: string) => void;
  setLinkedTaskId: (taskId: string | null) => void;
  setAutoStartNext: (value: boolean) => void;
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

export const useFocusTimer = create<FocusTimerState>((set, get) => ({
  mode: "focus",
  durationSeconds: FOCUS_PRESETS.focus.minutes * 60,
  remainingSeconds: FOCUS_PRESETS.focus.minutes * 60,
  isRunning: false,
  startedAt: null,
  endsAt: null,
  completedFocusCount: 0,
  autoStartNext: false,
  intention: "",
  linkedTaskId: null,
  lastFocusSeconds: FOCUS_PRESETS.focus.minutes * 60,

  setMode: (mode) => {
    const durationSeconds =
      mode === "focus"
        ? get().lastFocusSeconds
        : FOCUS_PRESETS[mode].minutes * 60;
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
    const { isRunning } = get();
    if (isRunning) return;
    const durationSeconds = Math.max(
      60,
      Math.min(FOCUS_MAX_SECONDS, Math.round(seconds)),
    );
    set({
      durationSeconds,
      remainingSeconds: durationSeconds,
      startedAt: null,
      endsAt: null,
      lastFocusSeconds:
        get().mode === "focus" ? durationSeconds : get().lastFocusSeconds,
    });
  },

  setIntention: (intention) => set({ intention }),

  setLinkedTaskId: (taskId) => set({ linkedTaskId: taskId }),

  setAutoStartNext: (value) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUTO_START_KEY, value ? "1" : "0");
    }
    set({ autoStartNext: value });
  },

  start: (seconds) => {
    const current = get();
    if (current.isRunning) return;

    const durationSeconds = seconds
      ? Math.max(60, Math.min(FOCUS_MAX_SECONDS, Math.round(seconds)))
      : current.durationSeconds;
    const remainingSeconds =
      seconds || current.remainingSeconds <= 0
        ? durationSeconds
        : current.remainingSeconds;

    if (remainingSeconds <= 0) return;

    const now = Date.now();
    set({
      durationSeconds,
      remainingSeconds,
      isRunning: true,
      startedAt: now,
      endsAt: now + remainingSeconds * 1000,
      lastFocusSeconds:
        current.mode === "focus" ? durationSeconds : current.lastFocusSeconds,
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
