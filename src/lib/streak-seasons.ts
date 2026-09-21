export type StreakSeason = {
  id: string;
  label: string;
  min: number;
  hint: string;
};

export const STREAK_SEASONS: StreakSeason[] = [
  { id: "ember", label: "Ember", min: 3, hint: "Spark holds" },
  { id: "steady", label: "Steady", min: 7, hint: "A full week" },
  { id: "deep", label: "Deep", min: 30, hint: "A month of return" },
  { id: "orbit", label: "Orbit", min: 100, hint: "Rare air" },
];

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100] as const;

export function streakSeasonFor(streak: number): StreakSeason | null {
  if (streak < 3) return null;
  let current: StreakSeason | null = null;
  for (const season of STREAK_SEASONS) {
    if (streak >= season.min) current = season;
  }
  return current;
}

const CELEBRATED_KEY = "imx-streak-milestones-v1";

function readCelebrated(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CELEBRATED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as number[];
    return Array.isArray(parsed) ? parsed.filter((n) => Number.isFinite(n)) : [];
  } catch {
    return [];
  }
}

function writeCelebrated(values: number[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CELEBRATED_KEY, JSON.stringify(values));
  } catch {
    /* ignore */
  }
}

/** Celebrate newly crossed milestones once; returns the highest new milestone or null. */
export function claimStreakMilestone(streak: number): number | null {
  if (typeof window === "undefined") return null;
  const celebrated = new Set(readCelebrated());
  let hit: number | null = null;
  for (const mark of STREAK_MILESTONES) {
    if (streak >= mark && !celebrated.has(mark)) {
      celebrated.add(mark);
      hit = mark;
    }
  }
  if (hit != null) writeCelebrated([...celebrated].sort((a, b) => a - b));
  return hit;
}
