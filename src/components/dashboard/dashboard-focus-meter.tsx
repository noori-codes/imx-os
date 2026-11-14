"use client";

import Link from "next/link";

import { ProgressRing } from "@/components/dashboard/progress-ring";
import { cn } from "@/lib/utils";
import { formatFocusMinutes } from "@/types/focus";

type DashboardFocusMeterProps = {
  focusMinutes: number;
  focusGoalMinutes: number;
  sessions: number;
};

/** Compact Forest-style daily focus progress — one ring, one CTA. */
export function DashboardFocusMeter({
  focusMinutes,
  focusGoalMinutes,
  sessions,
}: DashboardFocusMeterProps) {
  const goal = Math.max(1, focusGoalMinutes);
  const pct = Math.min(100, Math.round((focusMinutes / goal) * 100));
  const sealed = focusMinutes >= goal;

  return (
    <section className="dash-panel relative overflow-hidden">
      <div className="dash-panel-glow" aria-hidden />
      <div className="relative z-[1] flex items-center gap-4 px-5 py-4">
        <ProgressRing
          value={pct}
          size={56}
          stroke={4}
          sealed={sealed}
          className="shrink-0"
        >
          <span
            className={cn(
              "text-[11px] font-semibold tabular-nums",
              sealed ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {pct}%
          </span>
        </ProgressRing>

        <div className="min-w-0 flex-1">
          <p className="dash-panel-eyebrow">Focus</p>
          <p className="mt-0.5 text-sm font-semibold tracking-tight text-foreground">
            {sealed ? "Daily goal hit" : "Today’s block"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatFocusMinutes(focusMinutes)}
            <span className="text-muted-foreground/50"> / </span>
            {formatFocusMinutes(focusGoalMinutes)}
            {sessions > 0 ? (
              <span className="text-muted-foreground/70">
                {" "}
                · {sessions} session{sessions === 1 ? "" : "s"}
              </span>
            ) : null}
          </p>
        </div>

        <Link
          href="/focus"
          className="shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          Open
        </Link>
      </div>
    </section>
  );
}
