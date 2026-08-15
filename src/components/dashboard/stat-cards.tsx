import Link from "next/link";

import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/types/dashboard";

type MetricStripProps = {
  stats: DashboardStats;
};

export function MetricStrip({ stats }: MetricStripProps) {
  const primary = [
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
      label: "Focus today",
      value: stats.focus_minutes_today,
      suffix: "m",
    },
  ];

  const secondary = [
    { label: "Active", value: stats.active_tasks, href: "/tasks" },
    { label: "Done", value: stats.completed_tasks },
    {
      label: "Habits",
      value: `${stats.habits_done}/${stats.habits_total || 0}`,
      href: "/habits",
    },
    { label: "Goals", value: stats.goals, href: "/goals" },
  ];

  return (
    <div className="space-y-4 border-y border-border/60 py-5">
      <div className="flex flex-wrap gap-x-10 gap-y-4">
        {primary.map((metric) => (
          <div key={metric.label} className="min-w-[5rem]">
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
                <span className="ml-0.5 text-base font-medium text-muted-foreground">
                  {metric.suffix}
                </span>
              ) : null}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
        {secondary.map((metric) => {
          const content = (
            <>
              <span>{metric.label}</span>
              <span className="font-medium tabular-nums text-foreground/80">
                {metric.value}
              </span>
            </>
          );

          if (metric.href) {
            return (
              <Link
                key={metric.label}
                href={metric.href}
                className="inline-flex items-center gap-1.5 hover:text-foreground"
              >
                {content}
              </Link>
            );
          }

          return (
            <span
              key={metric.label}
              className="inline-flex items-center gap-1.5"
            >
              {content}
            </span>
          );
        })}
      </div>
    </div>
  );
}
