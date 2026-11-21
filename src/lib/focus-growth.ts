/**
 * Focus tree growth model — separate from timer state.
 *
 * DAY TREE (/focus main grove): sealed today only, scaled to daily goal;
 * past-goal minutes unlock advanced richness (good for heavy focus days).
 *
 * SESSION TREE (active focus block): grows from scratch.
 *   - Timed: matures exactly when the countdown ends.
 *   - Count-up: structure matures at 60m, flourish through ~2h, legendary soft-tails
 *     after that so 2h+ sessions keep rewarding without a hard freeze.
 */

import {
  clampDailyFocusGoal,
  FOCUS_DAILY_GOAL_DEFAULT,
} from "@/types/focus";

/** Session count-up: structural maturity for one focus block. */
export const FOCUS_GROWTH_SESSION_MATURE_SECONDS = 60 * 60;

/** Session count-up: flourish fills 60m → 2h of the same block. */
export const FOCUS_GROWTH_SESSION_FLOURISH_SECONDS = 120 * 60;

/** @deprecated Prefer FOCUS_GROWTH_SESSION_MATURE_SECONDS. */
export const FOCUS_GROWTH_COUNTUP_MATURE_SECONDS =
  FOCUS_GROWTH_SESSION_MATURE_SECONDS;

/** @deprecated Prefer FOCUS_GROWTH_SESSION_FLOURISH_SECONDS. */
export const FOCUS_GROWTH_COUNTUP_FLOURISH_SECONDS =
  FOCUS_GROWTH_SESSION_FLOURISH_SECONDS;

/**
 * Day-structure curve on t = elapsed/goal ∈ [0,1].
 * Front-loaded; lands on 1 at the daily goal.
 */
const DAY_STRUCTURE_CURVE: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0.04, 0.12],
  [0.1, 0.22],
  [0.18, 0.32],
  [0.28, 0.42],
  [0.42, 0.58],
  [0.58, 0.74],
  [0.78, 0.9],
  [1, 1],
];

/**
 * Session count-up structure (absolute seconds in this block).
 * Front-loaded; mature at 60m. Long sessions continue via advanced.
 */
const SESSION_COUNTUP_STRUCTURE: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [30, 0.1],
  [90, 0.2],
  [4 * 60, 0.3],
  [8 * 60, 0.42],
  [15 * 60, 0.58],
  [28 * 60, 0.74],
  [42 * 60, 0.88],
  [FOCUS_GROWTH_SESSION_MATURE_SECONDS, 1],
];

/**
 * Timed session curve on fraction t∈[0,1] — mature exactly at completion.
 */
const COUNTDOWN_CURVE: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0.04, 0.14],
  [0.1, 0.28],
  [0.2, 0.42],
  [0.35, 0.58],
  [0.55, 0.74],
  [0.75, 0.88],
  [1, 1],
];

export type FocusGrowthStage =
  | "seed"
  | "seedling"
  | "sapling"
  | "young"
  | "developing"
  | "mature"
  | "flourishing"
  | "legendary";

export type FocusGrowthModel = {
  progress: number;
  structure: number;
  advanced: number;
  stage: FocusGrowthStage;
  trunk: number;
  branches: number;
  leaves: number;
};

type FocusGrowthArgs = {
  grows: boolean;
  isStopwatch: boolean;
  elapsedSeconds: number;
  /** Timed session duration; ignored for day / count-up. */
  durationSeconds: number;
  /**
   * Daily focus goal in seconds. When set → day-tree path.
   * When omitted on count-up → session path (60m mature / 2h flourish).
   */
  goalSeconds?: number;
};

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function piecewise(
  x: number,
  points: ReadonlyArray<readonly [number, number]>,
) {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    if (x <= x1) {
      const t = x1 === x0 ? 1 : (x - x0) / (x1 - x0);
      return lerp(y0, y1, t);
    }
  }
  return points[points.length - 1][1];
}

export function resolveGrowthGoalSeconds(goalSeconds?: number): number {
  if (goalSeconds == null || !Number.isFinite(goalSeconds)) {
    return FOCUS_DAILY_GOAL_DEFAULT * 60;
  }
  const minutes = clampDailyFocusGoal(goalSeconds / 60);
  return minutes * 60;
}

/**
 * Structure 0–1.
 * Day (goalSeconds set): matures at daily goal.
 * Session count-up (no goal): matures at 60m of this block.
 */
export function countUpStructureProgress(
  elapsedSeconds: number,
  goalSeconds?: number,
): number {
  const elapsed = Math.max(0, elapsedSeconds);
  if (goalSeconds != null) {
    const goal = resolveGrowthGoalSeconds(goalSeconds);
    if (elapsed >= goal) return 1;
    return piecewise(elapsed / goal, DAY_STRUCTURE_CURVE);
  }
  if (elapsed >= FOCUS_GROWTH_SESSION_MATURE_SECONDS) return 1;
  return piecewise(elapsed, SESSION_COUNTUP_STRUCTURE);
}

/**
 * Advanced richness after structural maturity.
 * Day: flourish over another full goal length, then legendary soft-tail.
 * Session: flourish 60m→2h, legendary soft-tail after (keeps 2h+ sessions alive).
 */
export function countUpAdvancedProgress(
  elapsedSeconds: number,
  goalSeconds?: number,
): number {
  const elapsed = Math.max(0, elapsedSeconds);

  if (goalSeconds != null) {
    const goal = resolveGrowthGoalSeconds(goalSeconds);
    if (elapsed <= goal) return 0;
    const intoFlourish = elapsed - goal;
    const flourishSpan = goal;
    if (intoFlourish <= flourishSpan) {
      const t = intoFlourish / flourishSpan;
      return 1 - (1 - t) ** 1.35;
    }
    const past = intoFlourish - flourishSpan;
    const legendary = 1 - Math.exp(-past / (goal * 1.5));
    return 1 + legendary * 0.55;
  }

  // Session count-up — no daily goal coupling.
  if (elapsed <= FOCUS_GROWTH_SESSION_MATURE_SECONDS) return 0;
  const intoFlourish = elapsed - FOCUS_GROWTH_SESSION_MATURE_SECONDS;
  const flourishSpan =
    FOCUS_GROWTH_SESSION_FLOURISH_SECONDS - FOCUS_GROWTH_SESSION_MATURE_SECONDS;

  if (intoFlourish <= flourishSpan) {
    const t = intoFlourish / flourishSpan;
    return 1 - (1 - t) ** 1.35;
  }

  // After 2h in one block: keep developing slowly (3h, 4h… still matter).
  const past = intoFlourish - flourishSpan;
  const legendary = 1 - Math.exp(-past / (90 * 60));
  return 1 + legendary * 0.55;
}

export function countdownStructureProgress(
  elapsedSeconds: number,
  durationSeconds: number,
): number {
  if (durationSeconds <= 0) return 0;
  const t = clamp01(Math.max(0, elapsedSeconds) / durationSeconds);
  return piecewise(t, COUNTDOWN_CURVE);
}

function stageFrom(structure: number, advanced: number): FocusGrowthStage {
  if (advanced >= 1.15) return "legendary";
  if (advanced > 0.08) return "flourishing";
  if (structure >= 0.92) return "mature";
  if (structure >= 0.7) return "developing";
  if (structure >= 0.45) return "young";
  if (structure >= 0.22) return "sapling";
  if (structure >= 0.04) return "seedling";
  return "seed";
}

function layerFromStructure(structure: number) {
  const g = clamp01(structure);
  return {
    trunk: clamp01(g / 0.35),
    branches: clamp01((g - 0.08) / 0.55),
    leaves: clamp01((g - 0.18) / 0.82),
  };
}

export function focusGrowthModel({
  grows,
  isStopwatch,
  elapsedSeconds,
  durationSeconds,
  goalSeconds,
}: FocusGrowthArgs): FocusGrowthModel {
  if (!grows) {
    return {
      progress: 0,
      structure: 0,
      advanced: 0,
      stage: "seed",
      trunk: 0,
      branches: 0,
      leaves: 0,
    };
  }

  const elapsed = Math.max(0, elapsedSeconds);

  // Day tree (goal set) or session count-up.
  if (isStopwatch || goalSeconds != null) {
    const structure = countUpStructureProgress(elapsed, goalSeconds);
    const advanced = countUpAdvancedProgress(elapsed, goalSeconds);
    const layers = layerFromStructure(structure);
    return {
      progress: structure + advanced,
      structure,
      advanced,
      stage: stageFrom(structure, advanced),
      ...layers,
    };
  }

  // Timed session — mature exactly at countdown zero.
  const structure = countdownStructureProgress(elapsed, durationSeconds);
  const layers = layerFromStructure(structure);
  return {
    progress: structure,
    structure,
    advanced: 0,
    stage: stageFrom(structure, 0),
    ...layers,
  };
}

export function focusGrowthProgress(args: FocusGrowthArgs): number {
  return focusGrowthModel(args).progress;
}

/** @deprecated Prefer focusGrowthModel. */
export function focusGrowthLayers(growth: number) {
  const structure = clamp01(growth);
  const advanced = Math.max(0, growth - 1);
  return {
    ...layerFromStructure(structure),
    canopy: clamp01((structure - 0.18) / 0.82),
    sprout: Math.max(0, 1 - structure / 0.28),
    advanced,
  };
}

/** @deprecated */
export const FOCUS_GROWTH_COUNTUP_TARGET_SECONDS =
  FOCUS_GROWTH_SESSION_MATURE_SECONDS;

export function easeOutCubic(t: number): number {
  const x = clamp01(t);
  return 1 - (1 - x) ** 3;
}

export function easeOutGrowth(t: number): number {
  const x = clamp01(t);
  return 1 - (1 - x) ** 2.05;
}
