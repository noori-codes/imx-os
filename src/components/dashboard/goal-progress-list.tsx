import Link from "next/link";

import type { GoalProgress } from "@/types/dashboard";

type GoalProgressListProps = {
  goals: GoalProgress[];
};

export function GoalProgressList({ goals }: GoalProgressListProps) {
  return (
    <section className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Goals
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Progress on active goals
          </p>
        </div>
        <Link
          href="/goals"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          All
        </Link>
      </div>

      {goals.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No goals yet.{" "}
          <Link
            href="/goals"
            className="text-foreground underline-offset-2 hover:underline"
          >
            Create one
          </Link>
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-border/40">
          {goals.slice(0, 4).map((goal) => (
            <li
              key={goal.id}
              className="py-3.5 first:pt-0 last:pb-0"
            >
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/goals/${goal.id}`}
                  className="truncate text-sm text-foreground transition-colors hover:text-foreground/80"
                >
                  {goal.title}
                </Link>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {goal.progress}%
                </span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted/60">
                <div
                  className="h-full rounded-full bg-foreground/75 transition-all"
                  style={{ width: `${Math.min(100, goal.progress)}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] tabular-nums text-muted-foreground">
                {goal.completed_task_count}/{goal.task_count} tasks
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
