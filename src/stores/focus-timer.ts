"use client";

import { create } from "zustand";

import type { FocusMode } from "@/types/focus";
import { FOCUS_PRESETS } from "@/types/focus";

type FocusTimerState = {
  mode: FocusMode;
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  startedAt: number | null;
  completedFocusCount: number;
  setMode: (mode: FocusMode) => void;
  start: () => void;
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

  start: () => {
    const { isRunning, remainingSeconds } = get();
    if (isRunning || remainingSeconds <= 0) return;
    set({ isRunning: true, startedAt: Date.now() });
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
