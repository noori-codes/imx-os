/**
 * Count-up matures at classic deep-work length.
 * Growth stays fairly linear so leaves keep appearing little-by-little.
 */
export const FOCUS_GROWTH_COUNTUP_TARGET_SECONDS = 25 * 60;

export function easeOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return 1 - (1 - x) ** 3;
}

/** Front-load so a real seedling appears in the first couple minutes. */
export function easeOutGrowth(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return 1 - (1 - x) ** 2.05;
}

type FocusGrowthProgressArgs = {
  /** Focus / timed work grows; breaks stay at seed. */
  grows: boolean;
  isStopwatch: boolean;
  elapsedSeconds: number;
  durationSeconds: number;
};

/**
 * Continuous 0–1 growth for the chamber tree.
 * Countdown: elapsed / duration. Count-up: elapsed / 25m, capped at 1.
 */
export function focusGrowthProgress({
  grows,
  isStopwatch,
  elapsedSeconds,
  durationSeconds,
}: FocusGrowthProgressArgs): number {
  if (!grows) return 0;

  const elapsed = Math.max(0, elapsedSeconds);
  const raw = isStopwatch
    ? elapsed / FOCUS_GROWTH_COUNTUP_TARGET_SECONDS
    : durationSeconds > 0
      ? elapsed / durationSeconds
      : 0;

  const capped = Math.min(1, raw);
  return isStopwatch ? easeOutGrowth(capped) : easeOutCubic(capped);
}

/** Coarse layers for any callers still using staged growth. */
export function focusGrowthLayers(growth: number) {
  const g = Math.min(1, Math.max(0, growth));
  return {
    trunk: Math.min(1, g / 0.35),
    branches: Math.min(1, Math.max(0, (g - 0.08) / 0.55)),
    canopy: Math.min(1, Math.max(0, (g - 0.18) / 0.82)),
    sprout: Math.max(0, 1 - g / 0.28),
  };
}
