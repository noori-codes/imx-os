import { cn } from "@/lib/utils";
import type { WeekDaySummary } from "@/types/dashboard";

type WeekOverviewProps = {
  week: WeekDaySummary[];
};

export function WeekOverview({ week }: WeekOverviewProps) {
  const maxCount = Math.max(...week.map((d) => d.task_count), 1);

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm md:p-5">
      <h2 className="text-sm font-semibold tracking-tight">This week</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Tasks due each day (next 7 days)
      </p>

      <div className="mt-4 grid grid-cols-7 gap-2">
        {week.map((day) => (
          <div key={day.date} className="flex flex-col items-center gap-2">
            <span
              className={cn(
                "text-xs font-medium",
                day.is_today ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {day.day_label}
            </span>
            <div className="flex h-24 w-full items-end justify-center rounded-lg bg-muted/40 px-1.5 pb-1.5">
              <div
                className={cn(
                  "w-full max-w-8 rounded-sm transition-all",
                  day.task_count > 0 ? "bg-primary" : "bg-muted",
                )}
                style={{
                  height: `${Math.max((day.task_count / maxCount) * 100, day.task_count > 0 ? 12 : 4)}%`,
                }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground">{day.label}</span>
            <span
              className={cn(
                "text-sm font-semibold tabular-nums",
                day.is_today && "text-foreground",
              )}
            >
              {day.task_count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
