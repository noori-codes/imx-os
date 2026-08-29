"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { GoalProgress } from "@/types/dashboard";

type GoalProgressListProps = {
  goals: GoalProgress[];
};

type RingSize = "featured" | "compact";

function progressBand(progress: number): "low" | "mid" | "high" | "sealed" {
  if (progress >= 100) return "sealed";
  if (progress >= 67) return "high";
  if (progress >= 34) return "mid";
  return "low";
}

function pickFeatured(goals: GoalProgress[]): GoalProgress | null {
  if (goals.length === 0) return null;

  const withTasks = goals.filter((goal) => goal.task_count > 0);
  const pool = withTasks.length > 0 ? withTasks : goals;

  return [...pool].sort((a, b) => {
    if (b.progress !== a.progress) return b.progress - a.progress;
    return b.task_count - a.task_count;
  })[0] ?? null;
}

function ProgressRing({
  progress,
  index,
  size = "compact",
  showCenter = false,
}: {
  progress: number;
  index: number;
  size?: RingSize;
  showCenter?: boolean;
}) {
  const dim = size === "featured" ? 64 : 34;
  const stroke = size === "featured" ? 3 : 2.5;
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(progress, 0));
  const offset = circumference * (1 - pct / 100);
  const sealed = pct >= 100;
  const band = progressBand(pct);
  const center = dim / 2;

  return (
    <div
      className={cn(
        "relative shrink-0",
        size === "featured" ? "size-16" : "size-[34px]",
      )}
    >
      <svg
        width={dim}
        height={dim}
        viewBox={`0 0 ${dim} ${dim}`}
        className={cn(
          "dash-ring-draw -rotate-90",
          sealed && "dash-ring-sealed",
          size === "featured" && "dash-ring-featured",
        )}
        style={{ ["--i" as string]: index }}
        aria-hidden={showCenter ? undefined : true}
        role={showCenter ? "img" : undefined}
        aria-label={showCenter ? `${pct}% complete` : undefined}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-border/60"
        />
        {sealed ? (
          <>
            <circle
              cx={center}
              cy={center}
              r={radius - stroke * 0.15}
              className="dash-ring-disc fill-foreground"
            />
            <path
              d={
                size === "featured"
                  ? `M ${center - 5.5} ${center + 0.5} L ${center - 1.5} ${center + 4.5} L ${center + 6.5} ${center - 4}`
                  : `M ${center - 3.5} ${center + 0.5} L ${center - 1} ${center + 3} L ${center + 4} ${center - 2.5}`
              }
              fill="none"
              stroke="currentColor"
              strokeWidth={size === "featured" ? 2.2 : 1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="dash-ring-check text-background"
            />
          </>
        ) : (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(
              "dash-ring-fill",
              band === "low" && "text-muted-foreground/70",
              band === "mid" && "text-foreground/65",
              band === "high" && "text-foreground",
            )}
          />
        )}
      </svg>
      {showCenter && !sealed ? (
        <span
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center font-medium tabular-nums text-foreground",
            size === "featured" ? "text-sm" : "text-[10px]",
          )}
        >
          {pct}%
        </span>
      ) : null}
    </div>
  );
}

function goalTaskLabel(goal: GoalProgress) {
  if (goal.task_count === 0) return "No tasks yet";
  if (goal.progress >= 100) return "Sealed";
  return `${goal.completed_task_count}/${goal.task_count} tasks`;
}

export function GoalProgressList({ goals }: GoalProgressListProps) {
  const visible = goals.slice(0, 3);
  const featured = pickFeatured(visible);
  const rest = featured
    ? visible.filter((goal) => goal.id !== featured.id)
    : [];
  const withTasks = visible.filter((goal) => goal.task_count > 0);
  const avg =
    withTasks.length > 0
      ? Math.round(
          withTasks.reduce((sum, goal) => sum + goal.progress, 0) /
            withTasks.length,
        )
      : null;
  const allSealed =
    withTasks.length > 0 && withTasks.every((goal) => goal.progress >= 100);
  const [celebrateSealed, setCelebrateSealed] = useState(false);
  const prevAllSealed = useRef(allSealed);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      prevAllSealed.current = allSealed;
      return;
    }
    if (allSealed && !prevAllSealed.current) {
      setCelebrateSealed(true);
      const timer = window.setTimeout(() => setCelebrateSealed(false), 720);
      prevAllSealed.current = allSealed;
      return () => window.clearTimeout(timer);
    }
    prevAllSealed.current = allSealed;
  }, [allSealed]);

  const headlineValue =
    visible.length === 0
      ? "—"
      : featured && featured.task_count > 0
        ? `${featured.progress}%`
        : avg != null
          ? `${avg}%`
          : String(visible.length);

  const headlineHint =
    visible.length === 0
      ? "No goals yet"
      : allSealed
        ? "All sealed"
        : featured && featured.task_count > 0
          ? "leading goal"
          : avg != null
            ? "avg progress"
            : visible.length === 1
              ? "goal"
              : "goals";

  return (
    <section className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="dash-quad-label">Goals</p>
        <Link
          href="/goals"
          className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          All
        </Link>
      </div>

      <div
        className={cn(
          "dash-reveal mt-4",
          celebrateSealed && "dash-signal-celebrate",
        )}
      >
        <p
          className={cn(
            "dash-signal-value dash-quad-stat",
            visible.length === 0
              ? "text-muted-foreground"
              : allSealed
                ? celebrateSealed
                  ? "text-foreground"
                  : "text-muted-foreground"
                : "text-foreground",
          )}
        >
          {headlineValue}
        </p>
        {featured && featured.task_count > 0 ? (
          <Link
            href={`/goals/${featured.id}`}
            className="mt-1 block truncate text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {featured.title}
          </Link>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">{headlineHint}</p>
        )}
      </div>

      {visible.length === 0 ? (
        <Link
          href="/goals"
          className="mt-auto pt-6 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Create a goal
        </Link>
      ) : (
        <div className="mt-5 min-h-0 flex-1 border-t border-border/30 pt-4">
          {featured ? (
            <div
              className="dash-goal-featured dash-stagger flex items-center gap-3.5"
              style={{ ["--i" as string]: 0 }}
            >
              <ProgressRing
                progress={featured.progress}
                index={0}
                size="featured"
                showCenter
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/goals/${featured.id}`}
                  className="block truncate text-sm font-medium text-foreground transition-colors hover:text-foreground/75"
                >
                  {featured.title}
                </Link>
                <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                  {goalTaskLabel(featured)}
                </p>
              </div>
            </div>
          ) : null}

          {rest.length > 0 ? (
            <ul
              className={cn(
                "dash-stagger space-y-2.5",
                featured && "mt-3 border-t border-border/20 pt-3",
              )}
            >
              {rest.map((goal, index) => (
                <li
                  key={goal.id}
                  className="flex items-center gap-3"
                  style={{ ["--i" as string]: index + 1 }}
                >
                  <ProgressRing
                    progress={goal.progress}
                    index={index + 1}
                    size="compact"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/goals/${goal.id}`}
                      className="block truncate text-sm text-foreground transition-colors hover:text-foreground/75"
                    >
                      {goal.title}
                    </Link>
                    <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                      {goalTaskLabel(goal)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-[11px] tabular-nums text-muted-foreground",
                      goal.progress >= 100 && "font-medium text-foreground",
                    )}
                  >
                    {goal.progress}%
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </section>
  );
}
