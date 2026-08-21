"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { parseDateString } from "@/lib/date-utils";
import {
  FOCUS_DAILY_GOAL_DEFAULT,
  FOCUS_DAILY_GOAL_KEY,
  FOCUS_DAILY_GOAL_PRESETS,
  formatFocusMinutes,
  type FocusOverviewStats,
  type FocusWeekDay,
} from "@/types/focus";

const LEVEL_CLASS: Record<FocusWeekDay["level"], string> = {
  0: "bg-activity-0",
  1: "bg-activity-1",
  2: "bg-activity-2",
  3: "bg-activity-3",
  4: "bg-activity-4",
};

type FocusStatsProps = {
  stats: FocusOverviewStats;
};

function readGoalMinutes() {
  if (typeof window === "undefined") return FOCUS_DAILY_GOAL_DEFAULT;
  const raw = window.localStorage.getItem(FOCUS_DAILY_GOAL_KEY);
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 15 || value > 12 * 60) {
    return FOCUS_DAILY_GOAL_DEFAULT;
  }
  return Math.round(value);
}

export function FocusStats({ stats }: FocusStatsProps) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "short" });
  const [goalMinutes, setGoalMinutes] = useState(FOCUS_DAILY_GOAL_DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setGoalMinutes(readGoalMinutes());
    setReady(true);
  }, []);

  function updateGoal(minutes: number) {
    setGoalMinutes(minutes);
    window.localStorage.setItem(FOCUS_DAILY_GOAL_KEY, String(minutes));
  }

  const progress = Math.min(
    100,
    Math.round((stats.focus_minutes / Math.max(goalMinutes, 1)) * 100),
  );
  const remaining = Math.max(0, goalMinutes - stats.focus_minutes);
  const met = stats.focus_minutes >= goalMinutes;

  return (
    <div className="space-y-3 border-b border-border/60 pb-4">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>
          Today{" "}
          <span className="tabular-nums text-foreground">{today}</span>
        </span>
        <span>
          Sessions{" "}
          <span className="tabular-nums text-foreground">{stats.sessions}</span>
        </span>
        <span>
          Focused{" "}
          <span className="tabular-nums text-foreground">
            {formatFocusMinutes(stats.focus_minutes)}
          </span>
        </span>
        <span>
          Streak{" "}
          <span className="tabular-nums text-foreground">
            {stats.current_streak}d
          </span>
          {stats.longest_streak > 0 ? (
            <span className="text-muted-foreground">
              {" "}
              · best {stats.longest_streak}d
            </span>
          ) : null}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Daily goal{" "}
            <span className="tabular-nums text-foreground">
              {formatFocusMinutes(stats.focus_minutes)} /{" "}
              {formatFocusMinutes(goalMinutes)}
            </span>
            {ready ? (
              <span className="text-muted-foreground">
                {" "}
                ·{" "}
                {met
                  ? "Goal met"
                  : `${formatFocusMinutes(remaining)} left`}
              </span>
            ) : null}
          </p>
          <div className="flex flex-wrap gap-1">
            {FOCUS_DAILY_GOAL_PRESETS.map((preset) => {
              const active = goalMinutes === preset.minutes;
              return (
                <button
                  key={preset.minutes}
                  type="button"
                  onClick={() => updateGoal(preset.minutes)}
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[11px] tabular-nums transition-colors",
                    active
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={goalMinutes}
          aria-valuenow={Math.min(stats.focus_minutes, goalMinutes)}
          aria-label="Daily focus goal progress"
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500",
              met ? "bg-foreground" : "bg-foreground/80",
            )}
            style={{ width: `${ready ? progress : 0}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Last 7 days</p>
        <div className="flex items-end gap-1.5" aria-label="Focus week heatmap">
          {stats.week.map((day) => {
            const label = parseDateString(day.date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            const title =
              day.minutes <= 0
                ? `No focus on ${label}`
                : `${formatFocusMinutes(day.minutes)} on ${label}`;

            return (
              <div key={day.date} className="flex flex-col items-center gap-1">
                <span
                  title={title}
                  className={cn(
                    "size-3.5 rounded-sm",
                    LEVEL_CLASS[day.level],
                  )}
                  aria-label={title}
                />
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {parseDateString(day.date).toLocaleDateString("en-US", {
                    weekday: "narrow",
                  })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
