import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";

import type { GoalProgress } from "@/types/dashboard";

type GoalProgressListProps = {
  goals: GoalProgress[];
};

export function GoalProgressList({ goals }: GoalProgressListProps) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm md:p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight">Goal progress</h2>
        <Link
          href="/goals"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          View all
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {goals.length === 0 ? (
        <div className="mt-6 flex flex-col items-center py-6 text-center">
          <Target className="mb-2 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No goal tasks yet. Create a goal and add projects to track progress.
          </p>
          <Link
            href="/goals"
            className="mt-3 text-sm font-medium text-primary hover:underline"
          >
            Go to Goals
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {goals.map((goal) => (
            <li key={goal.id}>
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/goals/${goal.id}`}
                  className="truncate text-sm font-medium hover:underline"
                >
                  {goal.title}
                </Link>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {goal.completed_task_count}/{goal.task_count}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
