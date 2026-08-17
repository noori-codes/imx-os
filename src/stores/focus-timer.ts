"use client";

import { create } from "zustand";

import type { FocusMode } from "@/types/focus";
import { FOCUS_MAX_SECONDS, FOCUS_PRESETS } from "@/types/focus";

type FocusTimerState = {
  mode: FocusMode;
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  startedAt: number | null;
  completedFocusCount: number;
  setMode: (mode: FocusMode) => void;
  setDuration: (seconds: number) => void;
  start: (seconds?: number) => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  complete: () => void;
};

export const useFocusTimer = create<FocusTimerState>((set, get) => ({
  mode: "focus",
  durationSeconds: FOCUS_PRESETS.focus.minutes * 60,
  remainingSeconds: FOCUS_PRESETS.focus.minutes * 60,
  isRunning: false,
  startedAt: null,
  completedFocusCount: 0,

  setMode: (mode) => {
    const durationSeconds = FOCUS_PRESETS[mode].minutes * 60;
    set({
      mode,
      durationSeconds,
      remainingSeconds: durationSeconds,
      isRunning: false,
      startedAt: null,
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
    });
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

    set({
      durationSeconds,
      remainingSeconds,
      isRunning: true,
      startedAt: Date.now(),
    });
  },

  pause: () => {
    set({ isRunning: false });
  },

  reset: () => {
    const { durationSeconds } = get();
    set({
      remainingSeconds: durationSeconds,
      isRunning: false,
      startedAt: null,
    });
  },

  tick: () => {
    const { isRunning, remainingSeconds } = get();
    if (!isRunning) return;

    if (remainingSeconds <= 1) {
      get().complete();
      return;
    }

    set({ remainingSeconds: remainingSeconds - 1 });
  },

  complete: () => {
    const { mode, completedFocusCount } = get();
    set({
      remainingSeconds: 0,
      isRunning: false,
      completedFocusCount:
        mode === "focus" ? completedFocusCount + 1 : completedFocusCount,
    });
  },
}));
