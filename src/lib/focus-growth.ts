/**
 * Focus tree growth model — separate from timer state.
 *
 * DAY TREE (/focus main grove): sealed today only, scaled to daily goal;
 * past-goal minutes unlock advanced richness.
 * SESSION TREE (active focus block): grows from scratch — countdown matures
 * at session end; count-up uses absolute-minute milestones. Sealing adds
 * that session into the day tree.
 */

import {
  clampDailyFocusGoal,
  FOCUS_DAILY_GOAL_DEFAULT,
} from "@/types/focus";

/** Fallback when no goal is provided — matches default daily goal. */
export const FOCUS_GROWTH_COUNTUP_MATURE_SECONDS =
  FOCUS_DAILY_GOAL_DEFAULT * 60;

/** @deprecated Prefer goal-scaled dayAdvancedProgress. */
export const FOCUS_GROWTH_COUNTUP_FLOURISH_SECONDS =
  FOCUS_GROWTH_COUNTUP_MATURE_SECONDS * 2;

/**
 * Day-structure curve on t = elapsed/goal ∈ [0,1].
 * Front-loaded so early focus feels alive; lands on 1 at the daily goal.
 */
const DAY_STRUCTURE_CURVE: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0.04, 0.12], // seedling
  [0.1, 0.22], // stem
  [0.18, 0.32], // first lateral
  [0.28, 0.42], // more limbs + leaves
  [0.42, 0.58], // young canopy
  [0.58, 0.74], // recognizable tree
  [0.78, 0.9], // dense canopy
  [1, 1], // mature exactly at daily goal
];

/**
 * Absolute-minute milestones — used only when no goalSeconds is passed
 * (legacy count-up session path).
 */
const COUNTUP_STRUCTURE_MILESTONES: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [30, 0.1],
  [90, 0.2],
  [4 * 60, 0.3],
  [8 * 60, 0.42],
  [15 * 60, 0.58],
  [28 * 60, 0.74],
  [42 * 60, 0.88],
  [FOCUS_GROWTH_COUNTUP_MATURE_SECONDS, 1],
];

/**
 * Countdown visual curve on session fraction t∈[0,1] → structure.
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
  /** Selected countdown duration; ignored for day/count-up. */
  durationSeconds: number;
  /**
   * Daily focus goal in seconds. When set (day tree), structure matures at
   * the goal and advanced richness continues past it.
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

/** Resolve a safe goal floor so short goals still have room to grow. */
export function resolveGrowthGoalSeconds(goalSeconds?: number): number {
  if (goalSeconds == null || !Number.isFinite(goalSeconds)) {
    return FOCUS_DAILY_GOAL_DEFAULT * 60;
  }
  const minutes = clampDailyFocusGoal(goalSeconds / 60);
  return minutes * 60;
}

/**
 * Day / count-up structure 0–1.
 * With goalSeconds: matures exactly at the daily goal.
 * Without: legacy absolute-minute milestones (mature ~60m / default goal).
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
  if (elapsed >= FOCUS_GROWTH_COUNTUP_MATURE_SECONDS) return 1;
  return piecewise(elapsed, COUNTUP_STRUCTURE_MILESTONES);
}

/**
 * Advanced richness after structural maturity.
 * With goal: flourish fills over another full goal; legendary soft-tails after.
 * Heavy focus days keep developing instead of freezing at a 120m wall.
 */
export function countUpAdvancedProgress(
  elapsedSeconds: number,
  goalSeconds?: number,
): number {
  const elapsed = Math.max(0, elapsedSeconds);
  const goal = resolveGrowthGoalSeconds(goalSeconds);
  if (elapsed <= goal) return 0;

  const intoFlourish = elapsed - goal;
  const flourishSpan = goal; // 0→1 advanced across one more goal length

  if (intoFlourish <= flourishSpan) {
    const t = intoFlourish / flourishSpan;
    return 1 - (1 - t) ** 1.35;
  }

  const past = intoFlourish - flourishSpan;
  const legendaryTau = goal * 1.5;
  const legendary = 1 - Math.exp(-past / legendaryTau);
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

/** @deprecated Prefer focusGrowthModel — kept for any staged callers. */
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

/** @deprecated Use FOCUS_GROWTH_COUNTUP_MATURE_SECONDS. */
export const FOCUS_GROWTH_COUNTUP_TARGET_SECONDS =
  FOCUS_GROWTH_COUNTUP_MATURE_SECONDS;

export function easeOutCubic(t: number): number {
  const x = clamp01(t);
  return 1 - (1 - x) ** 3;
}

export function easeOutGrowth(t: number): number {
  const x = clamp01(t);
  return 1 - (1 - x) ** 2.05;
}
