import Link from "next/link";

import type { GoalProgress } from "@/types/dashboard";

type GoalProgressListProps = {
  goals: GoalProgress[];
};

function GhostGoal() {
  return (
    <div className="relative mt-5">
      <div className="dash-ghost pointer-events-none space-y-3" aria-hidden="true">
        <div className="flex justify-between gap-3">
          <span className="h-3 w-36 rounded-full bg-muted" />
          <span className="h-3 w-8 rounded-full bg-muted" />
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
          <div className="h-full w-1/3 rounded-full bg-foreground/20" />
        </div>
      </div>
      <Link
        href="/goals"
        className="mt-4 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Create a goal
      </Link>
    </div>
  );
}

export function GoalProgressList({ goals }: GoalProgressListProps) {
  const visible = goals.slice(0, 3);

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

      {visible.length === 0 ? (
        <GhostGoal />
      ) : (
        <ul className="dash-stagger mt-5 space-y-5">
          {visible.map((goal, index) => (
            <li key={goal.id} style={{ ["--i" as string]: index }}>
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
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted/50">
                <div
                  className="dash-bar-rise h-full rounded-full bg-foreground/80"
                  style={{
                    width: `${Math.min(100, goal.progress)}%`,
                    ["--i" as string]: index,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
