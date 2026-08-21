"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { parseDateString, toDateString } from "@/lib/date-utils";
import {
  FOCUS_DAILY_GOAL_DEFAULT,
  FOCUS_DAILY_GOAL_KEY,
  FOCUS_DAILY_GOAL_PRESETS,
  formatFocusMinutes,
  type FocusOverviewStats,
  type FocusWeekDay,
} from "@/types/focus";

const LEVEL_HEIGHT: Record<FocusWeekDay["level"], string> = {
  0: "h-1.5",
  1: "h-3",
  2: "h-5",
  3: "h-7",
  4: "h-9",
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
  const todayKey = toDateString(new Date());

  return (
    <section className="space-y-5">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Progress
        </p>
        <p className="focus-clock mt-2 text-[2rem] text-foreground">
          {formatFocusMinutes(stats.focus_minutes)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Focused today
          {stats.sessions > 0
            ? ` · ${stats.sessions} session${stats.sessions === 1 ? "" : "s"}`
            : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border/40 px-3 py-2.5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Streak
          </p>
          <p className="mt-1 text-lg font-medium tabular-nums tracking-tight">
            {stats.current_streak}
            <span className="text-sm font-normal text-muted-foreground">d</span>
          </p>
          {stats.longest_streak > 0 ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Best {stats.longest_streak}d
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-border/40 px-3 py-2.5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Goal
          </p>
          <p className="mt-1 text-lg font-medium tabular-nums tracking-tight">
            {ready ? `${progress}%` : "—"}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {ready
              ? met
                ? "Met"
                : `${formatFocusMinutes(remaining)} left`
              : "Loading"}
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Daily ·{" "}
            <span className="tabular-nums text-foreground">
              {formatFocusMinutes(stats.focus_minutes)} /{" "}
              {formatFocusMinutes(goalMinutes)}
            </span>
          </p>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted/80"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={goalMinutes}
          aria-valuenow={Math.min(stats.focus_minutes, goalMinutes)}
          aria-label="Daily focus goal progress"
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500",
              met ? "bg-foreground" : "bg-foreground/75",
            )}
            style={{ width: `${ready ? progress : 0}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FOCUS_DAILY_GOAL_PRESETS.map((preset) => {
            const active = goalMinutes === preset.minutes;
            return (
              <button
                key={preset.minutes}
                type="button"
                onClick={() => updateGoal(preset.minutes)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] tabular-nums transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs text-muted-foreground">Last 7 days</p>
        <div
          className="flex items-end justify-between gap-1.5"
          aria-label="Focus week heatmap"
        >
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
            const isToday = day.date === todayKey;
            return (
              <div
                key={day.date}
                className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
                title={title}
              >
                <div className="flex h-9 w-full items-end justify-center">
                  <span
                    className={cn(
                      "w-full max-w-3 rounded-sm transition-colors",
                      LEVEL_HEIGHT[day.level],
                      day.level === 0
                        ? "bg-muted"
                        : isToday
                          ? "bg-foreground"
                          : "bg-foreground/65",
                    )}
                    aria-label={title}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] tabular-nums",
                    isToday ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {parseDateString(day.date).toLocaleDateString("en-US", {
                    weekday: "narrow",
                  })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
