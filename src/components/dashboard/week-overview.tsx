import { cn } from "@/lib/utils";
import type { WeekDaySummary } from "@/types/dashboard";

type WeekOverviewProps = {
  week: WeekDaySummary[];
};

export function WeekOverview({ week }: WeekOverviewProps) {
  const maxCount = Math.max(...week.map((d) => d.task_count), 1);
  const total = week.reduce((sum, d) => sum + d.task_count, 0);

  return (
    <section className="border-t border-border/60 pt-8">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight">This week</h2>
        <p className="text-sm tabular-nums text-muted-foreground">
          {total} due
        </p>
      </div>

      <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {week.map((day) => (
          <div key={day.date} className="flex flex-col items-center gap-1.5">
            <span
              className={cn(
                "text-[11px] font-medium",
                day.is_today ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {day.day_label.slice(0, 2)}
            </span>
            <div className="flex h-10 w-full items-end justify-center sm:h-12">
              <div
                className={cn(
                  "w-full max-w-4 rounded-sm transition-all",
                  day.is_today && day.task_count > 0
                    ? "bg-foreground"
                    : day.task_count > 0
                      ? "bg-foreground/70"
                      : "bg-muted",
                )}
                style={{
                  height: `${Math.max(
                    (day.task_count / maxCount) * 100,
                    day.task_count > 0 ? 20 : 6,
                  )}%`,
                }}
              />
            </div>
            <span
              className={cn(
                "text-xs font-semibold tabular-nums",
                day.is_today ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {day.task_count}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
