/**
 * Focus tree growth model — separate from timer state.
 *
 * COUNTDOWN: commitment → nonlinear visual progress, mature exactly at end.
 * COUNT UP: living dedication → fast early milestones, then post-maturity richness.
 */

/** Count-up reaches structural maturity (progress = 1) at 60 minutes. */
export const FOCUS_GROWTH_COUNTUP_MATURE_SECONDS = 60 * 60;

/** Flourish fills 60→120 minutes; legendary soft-tails after that. */
export const FOCUS_GROWTH_COUNTUP_FLOURISH_SECONDS = 120 * 60;

/**
 * Count-up structure milestones (seconds → 0–1).
 * Front-loaded so the first 10 minutes feel alive; maturity at ~60m.
 * Values align with the tree’s organic reveal gates (branches ~0.22+, canopy ~0.74+).
 */
const COUNTUP_STRUCTURE_MILESTONES: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [30, 0.1], // seedling emerges within seconds→half minute
  [90, 0.2], // stem visibly developing (1–2m)
  [4 * 60, 0.3], // first lateral branches (3–5m)
  [8 * 60, 0.42], // leaves unfolding along limbs (5–10m)
  [15 * 60, 0.58], // multiple primary branches (10–20m)
  [28 * 60, 0.74], // recognizable young tree (20–35m)
  [42 * 60, 0.88], // fuller canopy + secondaries (35–50m)
  [FOCUS_GROWTH_COUNTUP_MATURE_SECONDS, 1], // normal maturity (50–60m)
];

/**
 * Countdown visual curve on session fraction t∈[0,1] → structure.
 * Faster early rewards; slows near the end; always lands on 1 at completion.
 */
const COUNTDOWN_CURVE: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0.04, 0.14], // seedling quickly
  [0.1, 0.28], // first branches early in the block
  [0.2, 0.42], // leaves along limbs
  [0.35, 0.58], // primary structure
  [0.55, 0.74], // young tree
  [0.75, 0.88], // canopy filling
  [1, 1], // mature exactly at zero
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

/**
 * Count-up structure 0–1 from real focus time.
 * After maturity, structure stays at 1 — richness moves into `advanced`.
 */
export function countUpStructureProgress(elapsedSeconds: number): number {
  const elapsed = Math.max(0, elapsedSeconds);
  if (elapsed >= FOCUS_GROWTH_COUNTUP_MATURE_SECONDS) return 1;
  return piecewise(elapsed, COUNTUP_STRUCTURE_MILESTONES);
}

/**
 * Count-up advanced richness after structural maturity.
 * 60–120m → 0–1 flourish. 120m+ → soft asymptote toward ~1.55 (legendary).
 */
export function countUpAdvancedProgress(elapsedSeconds: number): number {
  const elapsed = Math.max(0, elapsedSeconds);
  if (elapsed <= FOCUS_GROWTH_COUNTUP_MATURE_SECONDS) return 0;

  const flourishSpan =
    FOCUS_GROWTH_COUNTUP_FLOURISH_SECONDS - FOCUS_GROWTH_COUNTUP_MATURE_SECONDS;
  const intoFlourish = elapsed - FOCUS_GROWTH_COUNTUP_MATURE_SECONDS;

  if (intoFlourish <= flourishSpan) {
    // Slight ease-out inside the flourish band so 60–90 feels richer sooner.
    const t = intoFlourish / flourishSpan;
    return 1 - (1 - t) ** 1.35;
  }

  const past = intoFlourish - flourishSpan;
  const legendary = 1 - Math.exp(-past / (75 * 60));
  return 1 + legendary * 0.55;
}

/**
 * Countdown structure: nonlinear on elapsed/duration, clamped, ends at 1.
 */
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
