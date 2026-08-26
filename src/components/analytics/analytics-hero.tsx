import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  ANALYTICS_RANGES,
  type AnalyticsRangeDays,
} from "@/types/analytics";
import { formatFocusMinutes } from "@/types/focus";

type AnalyticsRangeToggleProps = {
  rangeDays: AnalyticsRangeDays;
};

export function AnalyticsRangeToggle({ rangeDays }: AnalyticsRangeToggleProps) {
  return (
    <div
      className="inline-flex rounded-full bg-muted/40 p-1"
      role="tablist"
      aria-label="Analytics range"
    >
      {ANALYTICS_RANGES.map((days) => {
        const active = days === rangeDays;
        return (
          <Link
            key={days}
            href={`/analytics?range=${days}`}
            scroll={false}
            role="tab"
            aria-selected={active}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs tabular-nums transition-colors",
              active
                ? "bg-background font-medium text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {days}d
          </Link>
        );
      })}
    </div>
  );
}

type AnalyticsHeroProps = {
  rangeDays: AnalyticsRangeDays;
  focusMinutes: number;
  habitsAvgRate: number;
  bestHabitStreak: number;
  focusGoalHitDays: number;
  focusGoalDays: number;
  focusSessions: number;
  tasksCompleted: number;
  dailyFocusGoalMinutes: number;
};

function buildStory({
  rangeDays,
  focusMinutes,
  habitsAvgRate,
  bestHabitStreak,
  focusGoalHitDays,
  focusGoalDays,
  focusSessions,
}: Omit<AnalyticsHeroProps, "tasksCompleted" | "dailyFocusGoalMinutes">) {
  if (focusMinutes <= 0 && focusSessions <= 0 && habitsAvgRate <= 0) {
    return `No sealed focus yet in the last ${rangeDays} days — start a block and it will show here.`;
  }

  const focusLabel = formatFocusMinutes(focusMinutes);
  const hitRate =
    focusGoalDays > 0
      ? Math.round((focusGoalHitDays / focusGoalDays) * 100)
      : 0;

  if (hitRate >= 70) {
    return `You sealed ${focusLabel} · hit your daily goal on ${focusGoalHitDays} of ${focusGoalDays} days.`;
  }
  if (bestHabitStreak >= 5) {
    return `You sealed ${focusLabel} · habits held at ${habitsAvgRate}% · best streak ${bestHabitStreak}d.`;
  }
  if (habitsAvgRate > 0) {
    return `You sealed ${focusLabel} across ${focusSessions} session${focusSessions === 1 ? "" : "s"} · habits at ${habitsAvgRate}%.`;
  }
  return `You sealed ${focusLabel} across ${focusSessions} session${focusSessions === 1 ? "" : "s"} in the last ${rangeDays} days.`;
}

export function AnalyticsHero({
  rangeDays,
  focusMinutes,
  habitsAvgRate,
  bestHabitStreak,
  focusGoalHitDays,
  focusGoalDays,
  focusSessions,
  tasksCompleted,
  dailyFocusGoalMinutes,
}: AnalyticsHeroProps) {
  const story = buildStory({
    rangeDays,
    focusMinutes,
    habitsAvgRate,
    bestHabitStreak,
    focusGoalHitDays,
    focusGoalDays,
    focusSessions,
  });

  const goalHitRate =
    focusGoalDays > 0
      ? Math.round((focusGoalHitDays / focusGoalDays) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 text-center sm:text-left">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Patterns
          </p>
          <p className="mt-2 max-w-xl text-base leading-snug text-foreground/90 sm:text-lg">
            {story}
          </p>
        </div>
        <div className="flex justify-center sm:justify-end">
          <AnalyticsRangeToggle rangeDays={rangeDays} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <div className="text-center sm:text-left">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Focus
          </p>
          <p className="mt-1.5 text-2xl font-medium tracking-tight tabular-nums text-foreground sm:text-3xl">
            {formatFocusMinutes(focusMinutes)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {focusSessions} session{focusSessions === 1 ? "" : "s"}
          </p>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Goal days
          </p>
          <p className="mt-1.5 text-2xl font-medium tracking-tight tabular-nums text-foreground sm:text-3xl">
            {goalHitRate}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {focusGoalHitDays}/{focusGoalDays} ·{" "}
            {formatFocusMinutes(dailyFocusGoalMinutes)}/day
          </p>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Habits
          </p>
          <p className="mt-1.5 text-2xl font-medium tracking-tight tabular-nums text-foreground sm:text-3xl">
            {habitsAvgRate}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">avg completion</p>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Best streak
          </p>
          <p className="mt-1.5 text-2xl font-medium tracking-tight tabular-nums text-foreground sm:text-3xl">
            {bestHabitStreak}d
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {tasksCompleted > 0
              ? `${tasksCompleted} task${tasksCompleted === 1 ? "" : "s"} done`
              : "habits"}
          </p>
        </div>
      </div>
    </div>
  );
}
