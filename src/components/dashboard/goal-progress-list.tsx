"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { ProgressRing } from "@/components/dashboard/progress-ring";
import { cn } from "@/lib/utils";
import type { GoalProgress } from "@/types/dashboard";

type GoalProgressListProps = {
  goals: GoalProgress[];
};

function goalTaskLabel(goal: GoalProgress) {
  if (goal.task_count === 0) return "Add tasks →";
  if (goal.progress >= 100) return "Sealed";
  return `${goal.completed_task_count}/${goal.task_count} tasks`;
}

export function GoalProgressList({ goals }: GoalProgressListProps) {
  const visible = goals.slice(0, 4);
  const withTasks = visible.filter((goal) => goal.task_count > 0);
  const allSealed =
    withTasks.length > 0 && withTasks.every((goal) => goal.progress >= 100);
  const featured = useMemo(() => {
    if (visible.length === 0) return null;
    const ranked = [...visible].sort((a, b) => {
      if (a.progress >= 100 && b.progress < 100) return 1;
      if (b.progress >= 100 && a.progress < 100) return -1;
      return b.progress - a.progress;
    });
    return ranked[0] ?? null;
  }, [visible]);
  const rest = featured
    ? visible.filter((goal) => goal.id !== featured.id)
    : visible;

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

  return (
    <section
      className={cn(
        "dash-panel relative flex h-full min-h-0 flex-col overflow-hidden",
        celebrateSealed && "dash-signal-celebrate",
      )}
    >
      <div className="dash-panel-glow" aria-hidden="true" />
      <div className="relative z-[1] flex items-center justify-between gap-3 border-b border-border/40 px-5 py-4">
        <div>
          <p className="dash-panel-eyebrow">North star</p>
          <h3 className="mt-0.5 text-sm font-semibold text-foreground">Goals</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {visible.length === 0
              ? "No goals yet"
              : allSealed
                ? "All sealed"
                : `${visible.length} active`}
          </p>
        </div>
        <Link
          href="/goals"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
        </Link>
      </div>

      {visible.length === 0 ? (
        <div className="relative z-[1] flex flex-1 flex-col items-start justify-center px-5 py-6">
          <Link
            href="/goals?compose=1"
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create a goal
          </Link>
        </div>
      ) : (
        <div className="relative z-[1] flex flex-1 flex-col gap-4 px-5 py-4">
          {featured ? (
            <div className="dash-goal-featured flex items-center gap-4">
              <ProgressRing
                value={featured.progress}
                size={64}
                stroke={4}
                featured
                sealed={featured.progress >= 100}
              >
                <span
                  className={cn(
                    "dash-signal-value text-xs font-semibold tabular-nums",
                    featured.progress >= 100
                      ? "dash-ring-check text-foreground"
                      : "text-foreground",
                  )}
                >
                  {featured.progress >= 100 ? "✓" : `${featured.progress}%`}
                </span>
              </ProgressRing>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/goals/${featured.id}`}
                  className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-foreground/75"
                >
                  {featured.title}
                </Link>
                <Link
                  href={`/goals/${featured.id}`}
                  className="mt-1 block text-[11px] font-medium tabular-nums text-foreground/80 underline-offset-2 hover:underline"
                >
                  {goalTaskLabel(featured)}
                </Link>
              </div>
            </div>
          ) : null}

          {rest.length > 0 ? (
            <ul className="dash-stagger space-y-3">
              {rest.map((goal, index) => (
                <li key={goal.id} style={{ ["--i" as string]: index }}>
                  <div className="flex items-baseline justify-between gap-3">
                    <Link
                      href={`/goals/${goal.id}`}
                      className="min-w-0 truncate text-sm font-medium text-foreground transition-colors hover:text-foreground/75"
                    >
                      {goal.title}
                    </Link>
                    <span
                      className={cn(
                        "shrink-0 text-xs tabular-nums text-muted-foreground",
                        goal.progress >= 100 && "font-medium text-foreground",
                      )}
                    >
                      {goal.progress}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-500 ease-out",
                        goal.progress >= 100
                          ? "bg-foreground"
                          : "bg-foreground/70",
                      )}
                      style={{ width: `${Math.min(100, goal.progress)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </section>
  );
}
