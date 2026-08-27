import Link from "next/link";

import type { GoalProgress } from "@/types/dashboard";

type GoalProgressListProps = {
  goals: GoalProgress[];
};

export function GoalProgressList({ goals }: GoalProgressListProps) {
  return (
    <section className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Goals
        </p>
        <Link
          href="/goals"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          All
        </Link>
      </div>

      {goals.length === 0 ? (
        <Link
          href="/goals"
          className="mt-5 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Create a goal
        </Link>
      ) : (
        <ul className="mt-5 divide-y divide-border/40">
          {goals.slice(0, 4).map((goal) => (
            <li key={goal.id} className="py-3.5 first:pt-0 last:pb-0">
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
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
