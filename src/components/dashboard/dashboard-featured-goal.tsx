"use client";

import Link from "next/link";
import { useMemo } from "react";

import { ProgressRing } from "@/components/dashboard/progress-ring";
import { cn } from "@/lib/utils";
import type { GoalProgress } from "@/types/dashboard";

type DashboardFeaturedGoalProps = {
  goals: GoalProgress[];
};

function goalTaskLabel(goal: GoalProgress) {
  if (goal.task_count === 0) return "Add tasks →";
  if (goal.progress >= 100) return "Sealed";
  return `${goal.completed_task_count}/${goal.task_count} tasks`;
}

/** Single north-star tile for the rhythm row when goals exist. */
export function DashboardFeaturedGoal({ goals }: DashboardFeaturedGoalProps) {
  const featured = useMemo(() => {
    if (goals.length === 0) return null;
    const ranked = [...goals].sort((a, b) => {
      if (a.progress >= 100 && b.progress < 100) return 1;
      if (b.progress >= 100 && a.progress < 100) return -1;
      return b.progress - a.progress;
    });
    return ranked[0] ?? null;
  }, [goals]);

  if (!featured) return null;

  const sealed = featured.progress >= 100;

  return (
    <section
      className={cn(
        "dash-panel relative flex h-full min-h-0 flex-col overflow-hidden",
        sealed && "dash-signal-celebrate",
      )}
    >
      <div className="dash-panel-glow" aria-hidden="true" />
      <div className="relative z-[1] flex items-center justify-between gap-3 border-b border-border/25 px-5 py-3.5">
        <div>
          <p className="dash-panel-eyebrow">North star</p>
          <h3 className="mt-0.5 text-sm font-semibold tracking-tight text-foreground">
            Goals
          </h3>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
            {goals.length === 1 ? "1 active" : `${goals.length} active`}
          </p>
        </div>
        <Link
          href="/goals"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
        </Link>
      </div>

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-4">
          <ProgressRing
            value={featured.progress}
            size={72}
            stroke={4.5}
            featured
            sealed={sealed}
          >
            <span
              className={cn(
                "dash-signal-value text-xs font-semibold tabular-nums",
                sealed ? "text-foreground" : "text-foreground",
              )}
            >
              {sealed ? "✓" : `${featured.progress}%`}
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

        <Link
          href={`/goals/${featured.id}`}
          className="inline-flex h-8 w-fit items-center rounded-lg border border-surface-border bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:border-border"
        >
          Open goal
        </Link>
      </div>
    </section>
  );
}
