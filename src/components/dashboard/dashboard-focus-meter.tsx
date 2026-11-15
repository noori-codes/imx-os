"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { ProgressRing } from "@/components/dashboard/progress-ring";
import { cn } from "@/lib/utils";
import { formatFocusMinutes } from "@/types/focus";

type DashboardFocusMeterProps = {
  focusMinutes: number;
  focusGoalMinutes: number;
  sessions: number;
};

/** Focus tile — matches habits header rhythm, fills the bento cell. */
export function DashboardFocusMeter({
  focusMinutes,
  focusGoalMinutes,
  sessions,
}: DashboardFocusMeterProps) {
  const goal = Math.max(1, focusGoalMinutes);
  const pct = Math.min(100, Math.round((focusMinutes / goal) * 100));
  const sealed = focusMinutes >= goal;

  return (
    <section className="dash-panel relative flex h-full min-h-0 flex-col overflow-hidden">
      <div className="dash-tile-head">
        <div>
          <p className="dash-panel-eyebrow">Studio</p>
          <h3 className="dash-tile-title">Focus</h3>
          <p className="dash-tile-sub">
            {sealed ? "Daily goal hit" : "Today’s block"}
          </p>
        </div>
        <Link href="/focus" className="dash-tile-link">
          Open
          <ArrowUpRight className="size-3 opacity-70" aria-hidden />
        </Link>
      </div>
      <div className="dash-tile-rule" aria-hidden />

      <div className="relative z-[1] flex min-h-0 flex-1 items-center gap-4 px-5 py-4">
        <ProgressRing
          value={pct}
          size={58}
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
          <p className="text-sm font-semibold tracking-tight text-foreground">
            {formatFocusMinutes(focusMinutes)}
            <span className="font-medium text-muted-foreground/55"> / </span>
            <span className="font-medium text-muted-foreground">
              {formatFocusMinutes(focusGoalMinutes)}
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {sessions > 0
              ? `${sessions} session${sessions === 1 ? "" : "s"} today`
              : "No sessions yet"}
          </p>
          <div className="dash-kpi-meter mt-3" aria-hidden>
            <span
              className="dash-kpi-meter-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
