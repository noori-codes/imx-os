"use client";

import { showFocusSealToast } from "@/components/focus/focus-seal-toast";
import {
  clampDailyFocusGoal,
  FOCUS_DAILY_GOAL_DEFAULT,
  FOCUS_DAILY_GOAL_KEY,
} from "@/types/focus";

const CONFETTI_CANVAS_ID = "imx-focus-confetti-canvas";

/** Single focus session length that triggers celebration (2 hours). */
export const FOCUS_MARATHON_SECONDS = 2 * 60 * 60;

/** Live goal from the sky rail (localStorage), falling back to server prop. */
export function readFocusDailyGoalMinutes(fallback = FOCUS_DAILY_GOAL_DEFAULT) {
  if (typeof window === "undefined") return clampDailyFocusGoal(fallback);
  const raw = window.localStorage.getItem(FOCUS_DAILY_GOAL_KEY);
  if (raw == null) return clampDailyFocusGoal(fallback);
  const value = Number(raw);
  if (!Number.isFinite(value)) return clampDailyFocusGoal(fallback);
  return clampDailyFocusGoal(value);
}

type ConfettiOptions = Record<string, unknown>;
type ConfettiFn = ((options?: ConfettiOptions) => Promise<null> | null) & {
  reset?: () => void;
  create?: (
    canvas: HTMLCanvasElement,
    opts?: { resize?: boolean; useWorker?: boolean },
  ) => ConfettiFn;
};

let confettiInstance: ConfettiFn | null = null;
let confettiModulePromise: Promise<ConfettiFn | null> | null = null;

function resolveConfettiExport(mod: unknown): ConfettiFn | null {
  if (typeof mod === "function") return mod as ConfettiFn;

  if (mod && typeof mod === "object") {
    const record = mod as Record<string, unknown>;
    const candidates = [record.default, record.confetti];

    for (const candidate of candidates) {
      if (typeof candidate === "function") return candidate as ConfettiFn;
      if (candidate && typeof candidate === "object") {
        const nested = candidate as Record<string, unknown>;
        if (typeof nested.default === "function") {
          return nested.default as ConfettiFn;
        }
      }
    }
  }

  return null;
}

async function loadConfettiModule(): Promise<ConfettiFn | null> {
  if (confettiModulePromise) return confettiModulePromise;

  confettiModulePromise = (async () => {
    try {
      const mod = await import("canvas-confetti");
      const resolved = resolveConfettiExport(mod);
      if (!resolved) {
        console.error("[focus] canvas-confetti export is not a function", mod);
        return null;
      }
      return resolved;
    } catch (error) {
      console.error("[focus] failed to load canvas-confetti", error);
      return null;
    }
  })();

  return confettiModulePromise;
}

function ensureConfettiCanvas(): HTMLCanvasElement {
  const existing = document.getElementById(
    CONFETTI_CANVAS_ID,
  ) as HTMLCanvasElement | null;
  if (existing) return existing;

  const canvas = document.createElement("canvas");
  canvas.id = CONFETTI_CANVAS_ID;
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "2147483647",
  });
  document.body.appendChild(canvas);
  return canvas;
}

async function getConfetti(): Promise<ConfettiFn | null> {
  if (typeof window === "undefined") return null;
  if (confettiInstance) return confettiInstance;

  const factory = await loadConfettiModule();
  if (!factory) return null;

  if (typeof factory.create === "function") {
    const canvas = ensureConfettiCanvas();
    confettiInstance = factory.create(canvas, {
      resize: true,
      useWorker: true,
    });
  } else {
    confettiInstance = factory;
  }

  return confettiInstance;
}

function themeColors() {
  const dark = document.documentElement.classList.contains("dark");
  return dark
    ? ["#fafafa", "#a1a1aa", "#71717a", "#52525b"]
    : ["#18181b", "#3f3f46", "#71717a", "#a1a1aa"];
}

async function burst(
  confetti: ConfettiFn,
  intensity: "full" | "light",
) {
  const colors = themeColors();
  const base = {
    colors,
    disableForReducedMotion: false,
    scalar: intensity === "full" ? 1 : 0.85,
    ticks: intensity === "full" ? 280 : 180,
  };

  if (intensity === "light") {
    await confetti({
      ...base,
      particleCount: 45,
      spread: 70,
      startVelocity: 32,
      origin: { x: 0.5, y: 0.6 },
    });
    return;
  }

  await confetti({
    ...base,
    particleCount: 120,
    spread: 86,
    startVelocity: 45,
    origin: { x: 0.5, y: 0.55 },
  });
  await confetti({
    ...base,
    particleCount: 60,
    angle: 60,
    spread: 55,
    origin: { x: 0.1, y: 0.7 },
  });
  await confetti({
    ...base,
    particleCount: 60,
    angle: 120,
    spread: 55,
    origin: { x: 0.9, y: 0.7 },
  });
}

/** Fire goal confetti onto a dedicated full-viewport canvas. */
export function fireFocusGoalConfetti(intensity: "full" | "light" = "full") {
  if (typeof window === "undefined") return;

  void (async () => {
    const confetti = await getConfetti();
    if (!confetti) return;

    try {
      await burst(confetti, intensity);
    } catch (error) {
      console.error("[focus] confetti failed", error);
      confettiInstance = null;
    }
  })();
}

/**
 * On finish/seal: celebrate when a single focus session reaches 2+ hours.
 */
export function celebrateMarathonSessionIfNeeded({
  sessionSeconds,
  todayMinutes,
  nextLabel,
  onMarkDone,
}: {
  sessionSeconds: number;
  todayMinutes?: number;
  nextLabel?: string;
  onMarkDone?: () => void;
}) {
  if (sessionSeconds < FOCUS_MARATHON_SECONDS) return false;

  fireFocusGoalConfetti("full");
  showFocusSealToast({
    kind: "marathon",
    title: "Huge focus session",
    seconds: sessionSeconds,
    todayMinutes,
    nextLabel,
    onMarkDone,
  });
  return true;
}
