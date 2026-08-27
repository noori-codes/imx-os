import Link from "next/link";

import type { GoalProgress } from "@/types/dashboard";

type GoalProgressListProps = {
  goals: GoalProgress[];
};

function GhostGoal() {
  return (
    <div className="flex flex-1 flex-col">
      <div
        className="pointer-events-none space-y-0 border-t border-border/30"
        aria-hidden="true"
      >
        {[
          { width: 68, fill: 34, opacity: 0.42 },
          { width: 54, fill: 22, opacity: 0.32 },
          { width: 40, fill: 14, opacity: 0.22 },
        ].map((row, i) => (
          <div
            key={i}
            className="border-b border-border/20 py-3 last:border-b-0"
            style={{ opacity: row.opacity }}
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className="h-2.5 rounded-full bg-muted"
                style={{ width: `${row.width}%` }}
              />
              <span className="h-2.5 w-7 rounded-full bg-muted" />
            </div>
            <div className="mt-2.5 h-px overflow-hidden rounded-full bg-border/40">
              <div
                className="h-full rounded-full bg-foreground/25"
                style={{ width: `${row.fill}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <Link
        href="/goals"
        className="mt-auto pt-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
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
        <div className="flex items-baseline gap-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Goals
          </p>
          {visible.length > 0 ? (
            <span className="text-[11px] tabular-nums text-muted-foreground/70">
              {visible.length}
            </span>
          ) : null}
        </div>
        <Link
          href="/goals"
          className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          All
        </Link>
      </div>

      {visible.length === 0 ? (
        <div className="mt-3 flex min-h-0 flex-1 flex-col">
          <GhostGoal />
        </div>
      ) : (
        <ul className="dash-stagger mt-3 min-h-0 flex-1 border-t border-border/30">
          {visible.map((goal, index) => (
            <li
              key={goal.id}
              className="border-b border-border/30 py-3 last:border-b-0"
              style={{ ["--i" as string]: index }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <Link
                  href={`/goals/${goal.id}`}
                  className="min-w-0 truncate text-sm text-foreground transition-colors hover:text-foreground/75"
                >
                  {goal.title}
                </Link>
                <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                  {goal.progress}%
                </span>
              </div>
              <div className="mt-2.5 h-px overflow-hidden rounded-full bg-border/50">
                <div
                  className="dash-bar-rise h-full rounded-full bg-foreground/70"
                  style={{
                    width: `${Math.min(100, Math.max(goal.progress, 0))}%`,
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
