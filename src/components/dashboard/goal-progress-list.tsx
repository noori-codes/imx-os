import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { GoalProgress } from "@/types/dashboard";

type GoalProgressListProps = {
  goals: GoalProgress[];
};

export function GoalProgressList({ goals }: GoalProgressListProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Goals</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Progress</p>
        </div>
        <Link
          href="/goals"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          All
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {goals.length === 0 ? (
        <Link
          href="/goals"
          className="inline-flex text-sm font-medium hover:underline"
        >
          Create a goal
        </Link>
      ) : (
        <ul className="space-y-5">
          {goals.map((goal) => (
            <li key={goal.id}>
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/goals/${goal.id}`}
                  className="truncate text-sm font-medium hover:underline"
                >
                  {goal.title}
                </Link>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {goal.progress}%
                </span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground/80 transition-all"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
