"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import type { ActivitySummary } from "@/types/dashboard";

type DashboardActivityHeatProps = {
  activity: ActivitySummary;
};

const LEVEL_CLASS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-activity-0 ring-1 ring-inset ring-border/35",
  1: "bg-activity-1",
  2: "bg-activity-2",
  3: "bg-activity-3",
  4: "bg-activity-4",
};

/** Compact 90-day heat — looks intentional even at zero. */
export function DashboardActivityHeat({ activity }: DashboardActivityHeatProps) {
  const days = activity.days;
  const active = activity.active_days;
  const total = activity.total;
  const streak = activity.current_streak;

  const subtitle =
    total === 0
      ? "Quiet field — seal a day to light a cell"
      : streak > 0
        ? `${active} active · ${streak}d streak`
        : `${active} active day${active === 1 ? "" : "s"}`;

  return (
    <section className="dash-panel relative flex h-full min-h-0 flex-col overflow-hidden">
      <div className="dash-panel-glow" aria-hidden="true" />
      <div className="relative z-[1] flex items-center justify-between gap-3 border-b border-border/25 px-5 py-3.5">
        <div>
          <p className="dash-panel-eyebrow">Signal</p>
          <h3 className="mt-0.5 text-sm font-semibold tracking-tight text-foreground">
            Activity
          </h3>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
            {subtitle}
          </p>
        </div>
        <Link
          href="/analytics"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Analytics
        </Link>
      </div>

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col gap-4 px-5 py-4">
        <div
          className="dash-activity-heat min-h-[7.5rem] w-full flex-1"
          role="img"
          aria-label={`Activity over ${days.length} days`}
        >
          {days.map((day, index) => (
            <span
              key={day.date}
              title={`${day.date}: ${day.count}`}
              className={cn(
                "dash-activity-cell rounded-[2px]",
                LEVEL_CLASS[day.level],
              )}
              style={{ ["--i" as string]: index }}
            />
          ))}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3">
          <div className="flex items-center gap-1" aria-hidden>
            <span className="text-[10px] text-muted-foreground/70">Less</span>
            {([0, 1, 2, 3, 4] as const).map((level) => (
              <span
                key={level}
                className={cn("size-2 rounded-[2px]", LEVEL_CLASS[level])}
              />
            ))}
            <span className="text-[10px] text-muted-foreground/70">More</span>
          </div>
          <Link
            href="/analytics?range=90"
            className="text-[11px] font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
          >
            Open map
          </Link>
        </div>
      </div>
    </section>
  );
}
