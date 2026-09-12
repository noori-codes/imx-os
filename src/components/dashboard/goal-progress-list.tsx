"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { GoalProgress } from "@/types/dashboard";

type GoalProgressListProps = {
  goals: GoalProgress[];
};

function goalTaskLabel(goal: GoalProgress) {
  if (goal.task_count === 0) return "No tasks yet";
  if (goal.progress >= 100) return "Sealed";
  return `${goal.completed_task_count}/${goal.task_count} tasks`;
}

export function GoalProgressList({ goals }: GoalProgressListProps) {
  const visible = goals.slice(0, 4);
  const withTasks = visible.filter((goal) => goal.task_count > 0);
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

  return (
    <section
      className={cn(
        "dash-panel flex h-full min-h-0 flex-col",
        celebrateSealed && "dash-signal-celebrate",
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/40 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Goals</h3>
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
        <div className="flex flex-1 flex-col items-start justify-center px-5 py-6">
          <Link
            href="/goals"
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create a goal
          </Link>
        </div>
      ) : (
        <ul className="dash-stagger flex-1 space-y-4 px-5 py-4">
          {visible.map((goal, index) => (
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
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-500 ease-out",
                    goal.progress >= 100 ? "bg-foreground" : "bg-foreground/70",
                  )}
                  style={{ width: `${Math.min(100, goal.progress)}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] tabular-nums text-muted-foreground">
                {goalTaskLabel(goal)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
