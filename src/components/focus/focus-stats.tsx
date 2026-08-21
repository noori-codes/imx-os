"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

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

const DOT_SIZE: Record<FocusWeekDay["level"], string> = {
  0: "size-1.5 opacity-30",
  1: "size-2 opacity-55",
  2: "size-2.5 opacity-75",
  3: "size-3 opacity-90",
  4: "size-3.5",
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
  const [goalOpen, setGoalOpen] = useState(false);

  useEffect(() => {
    setGoalMinutes(readGoalMinutes());
    setReady(true);
  }, []);

  function updateGoal(minutes: number) {
    setGoalMinutes(minutes);
    window.localStorage.setItem(FOCUS_DAILY_GOAL_KEY, String(minutes));
    setGoalOpen(false);
  }

  const progress = Math.min(
    100,
    Math.round((stats.focus_minutes / Math.max(goalMinutes, 1)) * 100),
  );
  const remaining = Math.max(0, goalMinutes - stats.focus_minutes);
  const met = stats.focus_minutes >= goalMinutes;
  const todayKey = toDateString(new Date());

  const streakLine = [
    `${stats.current_streak}d streak`,
    stats.longest_streak > 0 ? `best ${stats.longest_streak}d` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="space-y-5">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Progress
        </p>
        <p className="focus-clock mt-2 text-[2rem] text-foreground">
          {formatFocusMinutes(stats.focus_minutes)}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Focused today
          {stats.sessions > 0
            ? ` · ${stats.sessions} session${stats.sessions === 1 ? "" : "s"}`
            : ""}
        </p>
        <p className="mt-1 text-xs tabular-nums text-muted-foreground/80">
          {streakLine}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {ready ? (
              met ? (
                <>
                  Goal met ·{" "}
                  <span className="tabular-nums text-foreground">
                    {formatFocusMinutes(goalMinutes)}
                  </span>
                </>
              ) : (
                <>
                  <span className="tabular-nums text-foreground">
                    {formatFocusMinutes(remaining)}
                  </span>{" "}
                  to{" "}
                  <span className="tabular-nums">
                    {formatFocusMinutes(goalMinutes)}
                  </span>{" "}
                  goal
                </>
              )
            ) : (
              "Daily goal"
            )}
          </p>
          <button
            type="button"
            onClick={() => setGoalOpen((value) => !value)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            aria-expanded={goalOpen}
          >
            Change
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform duration-200",
                goalOpen && "rotate-180",
              )}
            />
          </button>
        </div>

        <div
          className="h-1 overflow-hidden rounded-full bg-muted/70"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={goalMinutes}
          aria-valuenow={Math.min(stats.focus_minutes, goalMinutes)}
          aria-label="Daily focus goal progress"
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500",
              met ? "bg-foreground" : "bg-foreground/70",
            )}
            style={{ width: `${ready ? progress : 0}%` }}
          />
        </div>

        {goalOpen ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
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
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div
        className="flex items-center justify-between gap-2"
        aria-label="Focus week"
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
              className="flex flex-col items-center gap-1.5"
              title={title}
            >
              <span
                className={cn(
                  "rounded-full transition-colors",
                  DOT_SIZE[day.level],
                  day.level === 0
                    ? "bg-muted-foreground"
                    : isToday
                      ? "bg-foreground"
                      : "bg-foreground/70",
                )}
                aria-label={title}
              />
              <span
                className={cn(
                  "text-[10px] tabular-nums",
                  isToday
                    ? "text-foreground"
                    : "text-muted-foreground/70",
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
    </section>
  );
}
