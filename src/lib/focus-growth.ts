/**
 * Focus tree growth model — separate from timer state.
 *
 * COUNTDOWN: commitment → mature exactly at session end (elapsed / duration).
 * COUNT UP: living dedication → milestone curve that continues past maturity.
 */

/** Count-up reaches structural maturity (progress = 1) at 45 minutes. */
export const FOCUS_GROWTH_COUNTUP_MATURE_SECONDS = 45 * 60;

/** Count-up flourish band fills across 45→90 minutes. */
export const FOCUS_GROWTH_COUNTUP_FLOURISH_SECONDS = 90 * 60;

/**
 * Piecewise structure milestones for count-up (seconds → 0–1 structure).
 * Continuous linear segments — never stage swaps.
 * Kept snappy so early focus feels rewarding; long sessions still unlock flourish.
 */
const COUNTUP_STRUCTURE_MILESTONES: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [2 * 60, 0.14], // tiny seedling
  [8 * 60, 0.35], // stronger stem + first branches
  [18 * 60, 0.55], // primary branches + initial leaves
  [30 * 60, 0.8], // secondary branches + developing canopy
  [FOCUS_GROWTH_COUNTUP_MATURE_SECONDS, 1], // mature tree
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
  /**
   * Primary growth scalar.
   * Countdown: always 0–1.
   * Count-up: 0–1 through maturity, then >1 for advanced richness.
   */
  progress: number;
  /** Trunk / branch / canopy structure (always 0–1). */
  structure: number;
  /** Beyond-maturity richness (0+; count-up after mature). */
  advanced: number;
  stage: FocusGrowthStage;
  trunk: number;
  branches: number;
  leaves: number;
};

type FocusGrowthArgs = {
  /** Focus / timed work grows; breaks stay at seed. */
  grows: boolean;
  isStopwatch: boolean;
  elapsedSeconds: number;
  /** Selected countdown duration; ignored for count-up. */
  durationSeconds: number;
};

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Interpolate along sorted [x, y] milestones. */
function piecewise(elapsed: number, points: ReadonlyArray<readonly [number, number]>) {
  if (elapsed <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    if (elapsed <= x1) {
      const t = x1 === x0 ? 1 : (elapsed - x0) / (x1 - x0);
      return lerp(y0, y1, t);
    }
  }
  return points[points.length - 1][1];
}

/**
 * Count-up structure 0–1 from real focus minutes (milestones above).
 * After maturity, structure stays at 1 — richness moves into `advanced`.
 */
export function countUpStructureProgress(elapsedSeconds: number): number {
  const elapsed = Math.max(0, elapsedSeconds);
  if (elapsed >= FOCUS_GROWTH_COUNTUP_MATURE_SECONDS) return 1;
  return piecewise(elapsed, COUNTUP_STRUCTURE_MILESTONES);
}

/**
 * Count-up advanced richness after structural maturity.
 * 45–90m → 0–1 flourish. 90m+ → soft asymptote toward ~1.55 (legendary).
 */
export function countUpAdvancedProgress(elapsedSeconds: number): number {
  const elapsed = Math.max(0, elapsedSeconds);
  if (elapsed <= FOCUS_GROWTH_COUNTUP_MATURE_SECONDS) return 0;

  const flourishSpan =
    FOCUS_GROWTH_COUNTUP_FLOURISH_SECONDS - FOCUS_GROWTH_COUNTUP_MATURE_SECONDS;
  const intoFlourish = elapsed - FOCUS_GROWTH_COUNTUP_MATURE_SECONDS;

  if (intoFlourish <= flourishSpan) {
    return intoFlourish / flourishSpan;
  }

  const past = intoFlourish - flourishSpan;
  // Soft legendary tail — never runaway size.
  const legendary = 1 - Math.exp(-past / (60 * 60));
  return 1 + legendary * 0.55;
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

/**
 * Deterministic growth model from timer inputs.
 * Same args → same tree. Does not mutate timer state.
 */
export function focusGrowthModel({
  grows,
  isStopwatch,
  elapsedSeconds,
  durationSeconds,
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

  if (isStopwatch) {
    const structure = countUpStructureProgress(elapsed);
    const advanced = countUpAdvancedProgress(elapsed);
    const layers = layerFromStructure(structure);
    return {
      progress: structure + advanced,
      structure,
      advanced,
      stage: stageFrom(structure, advanced),
      ...layers,
    };
  }

  // COUNTDOWN — goal-based: mature exactly when the session completes.
  const structure =
    durationSeconds > 0 ? clamp01(elapsed / durationSeconds) : 0;
  const layers = layerFromStructure(structure);
  return {
    progress: structure,
    structure,
    advanced: 0,
    stage: stageFrom(structure, 0),
    ...layers,
  };
}

/**
 * Primary 0…n progress scalar for the chamber tree.
 * Countdown capped at 1. Count-up may exceed 1 (advanced richness).
 */
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
