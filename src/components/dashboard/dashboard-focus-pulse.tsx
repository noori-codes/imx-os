"use client";

import Link from "next/link";
import { Timer } from "lucide-react";

import { ProgressRing } from "@/components/dashboard/progress-ring";
import { cn } from "@/lib/utils";
import { formatFocusMinutes } from "@/types/focus";

type DashboardFocusPulseProps = {
  focusMinutes: number;
  focusGoalMinutes: number;
  sessions: number;
};

/** Focus goal instrument — always shows a ring, even at zero. */
export function DashboardFocusPulse({
  focusMinutes,
  focusGoalMinutes,
  sessions,
}: DashboardFocusPulseProps) {
  const goal = Math.max(0, focusGoalMinutes);
  const pct =
    goal > 0 ? Math.min(100, Math.round((focusMinutes / goal) * 100)) : 0;
  const sealed = goal > 0 && focusMinutes >= goal;
  const remaining = Math.max(0, goal - focusMinutes);

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
          <p className="dash-panel-eyebrow">Depth</p>
          <h3 className="mt-0.5 text-sm font-semibold tracking-tight text-foreground">
            Focus
          </h3>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
            {goal <= 0
              ? "No daily goal set"
              : sealed
                ? "Goal sealed"
                : `${formatFocusMinutes(remaining)} to goal`}
          </p>
        </div>
        <Link
          href="/focus"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Open
        </Link>
      </div>

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-4">
          <ProgressRing
            value={goal > 0 ? pct : 0}
            size={72}
            stroke={4.5}
            featured
            sealed={sealed}
          >
            <span
              className={cn(
                "dash-signal-value text-xs font-semibold tabular-nums",
                sealed ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {sealed ? "✓" : goal > 0 ? `${pct}%` : "—"}
            </span>
          </ProgressRing>
          <div className="min-w-0">
            <p className="text-sm font-semibold tabular-nums text-foreground">
              {formatFocusMinutes(focusMinutes)}
              {goal > 0 ? (
                <span className="font-normal text-muted-foreground">
                  {" "}
                  / {formatFocusMinutes(goal)}
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {sessions > 0
                ? `${sessions} block${sessions === 1 ? "" : "s"} today`
                : "No blocks yet today"}
            </p>
          </div>
        </div>

        <Link
          href="/focus"
          className="inline-flex h-8 w-fit items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90"
        >
          <Timer className="size-3.5 opacity-80" aria-hidden />
          {sealed ? "Another block" : focusMinutes > 0 ? "Continue" : "Start a block"}
        </Link>
      </div>
    </section>
  );
}
