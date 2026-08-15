import Link from "next/link";

import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/types/dashboard";

type MetricStripProps = {
  stats: DashboardStats;
};

export function MetricStrip({ stats }: MetricStripProps) {
  const metrics = [
    {
      label: "Due today",
      value: stats.due_today,
      warn: stats.due_today > 0,
    },
    {
      label: "Overdue",
      value: stats.overdue,
      warn: stats.overdue > 0,
    },
    {
      label: "Streak",
      value: stats.activity_streak,
      suffix: "d",
    },
    {
      label: "Focus",
      value: stats.focus_minutes_today,
      suffix: "m",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-6 border-y border-border/60 py-5 sm:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.label}>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {metric.label}
          </p>
          <p
            className={cn(
              "mt-1 text-3xl font-semibold tracking-tight tabular-nums",
              metric.warn && "text-destructive",
            )}
          >
            {metric.value}
            {metric.suffix ? (
              <span className="ml-0.5 text-sm font-medium text-muted-foreground">
                {metric.suffix}
              </span>
            ) : null}
          </p>
        </div>
      ))}
    </div>
  );
}
