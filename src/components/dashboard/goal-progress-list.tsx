"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { GoalProgress } from "@/types/dashboard";

type GoalProgressListProps = {
  goals: GoalProgress[];
};

function ProgressRing({
  progress,
  index,
}: {
  progress: number;
  index: number;
}) {
  const size = 36;
  const stroke = 2.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(progress, 0));
  const offset = circumference * (1 - pct / 100);
  const sealed = pct >= 100;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn(
        "dash-ring-draw shrink-0 -rotate-90",
        sealed && "dash-ring-sealed",
      )}
      style={{ ["--i" as string]: index }}
      aria-hidden="true"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-border/60"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="dash-ring-fill text-foreground/80"
      />
    </svg>
  );
}

export function GoalProgressList({ goals }: GoalProgressListProps) {
  const visible = goals.slice(0, 3);
  const withTasks = visible.filter((g) => g.task_count > 0);
  const avg =
    withTasks.length > 0
      ? Math.round(
          withTasks.reduce((sum, g) => sum + g.progress, 0) / withTasks.length,
        )
      : null;
  const allSealed =
    withTasks.length > 0 && withTasks.every((g) => g.progress >= 100);
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
    <section className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Goals
        </p>
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
            "dash-signal-value text-4xl font-medium tracking-tight tabular-nums",
            visible.length === 0
              ? "text-muted-foreground"
              : allSealed
                ? celebrateSealed
                  ? "text-foreground"
                  : "text-muted-foreground"
                : "text-foreground",
          )}
        >
          {visible.length === 0
            ? "—"
            : avg != null
              ? `${avg}%`
              : visible.length}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {visible.length === 0
            ? "No goals yet"
            : allSealed
              ? "All sealed"
              : avg != null
                ? "avg progress"
                : visible.length === 1
                  ? "goal"
                  : "goals"}
        </p>
      </div>

      {visible.length === 0 ? (
        <Link
          href="/goals"
          className="mt-auto pt-6 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Create a goal
        </Link>
      ) : (
        <ul className="dash-stagger mt-5 min-h-0 flex-1 space-y-3 border-t border-border/30 pt-4">
          {visible.map((goal, index) => (
            <li
              key={goal.id}
              className="flex items-center gap-3"
              style={{ ["--i" as string]: index }}
            >
              <ProgressRing progress={goal.progress} index={index} />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/goals/${goal.id}`}
                  className="block truncate text-sm text-foreground transition-colors hover:text-foreground/75"
                >
                  {goal.title}
                </Link>
                <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                  {goal.task_count === 0
                    ? "No tasks yet"
                    : goal.progress >= 100
                      ? "Sealed"
                      : `${goal.completed_task_count}/${goal.task_count} tasks`}
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
      )}
    </section>
  );
}
