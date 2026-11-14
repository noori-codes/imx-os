"use client";

import { fireFocusGoalConfetti } from "@/lib/focus-celebrate";
import { imxToast } from "@/lib/imx-toast";

/** Soft completion payoffs — used by morning plan, habits, and focus seals. */

function celebrateEnabled() {
  if (typeof window === "undefined") return true;
  try {
    if (window.localStorage.getItem("imx-focus-celebrate") === "0") return false;
  } catch {
    /* ignore */
  }
  return true;
}

/** Soft haptic-ish feedback via short vibration when available. */
export function softCompletePulse() {
  if (typeof navigator === "undefined") return;
  try {
    if ("vibrate" in navigator) navigator.vibrate(12);
  } catch {
    /* ignore */
  }
}

/** Quiet confirmation for a single completion — no confetti. */
export function softCompleteToast(label = "Done") {
  softCompletePulse();
  imxToast(label, { tone: "success" });
}

/**
 * Bigger celebrate only for meaningful clears:
 * clearing Today, sealing a goal, marathon focus (handled elsewhere).
 */
export function celebrateMeaningfulClear(kind: "today" | "goal" | "shutdown") {
  if (!celebrateEnabled()) {
    softCompletePulse();
    return;
  }
  softCompletePulse();
  fireFocusGoalConfetti(kind === "goal" ? "full" : "light");
  const title =
    kind === "today"
      ? "Today is clear"
      : kind === "goal"
        ? "Goal sealed"
        : "Day sealed";
  imxToast(title, {
    tone: "success",
    description:
      kind === "today"
        ? "Nice close — focus or review when you’re ready."
        : kind === "goal"
          ? "A real finish. Take a breath."
          : "Evening loop closed.",
  });
}
