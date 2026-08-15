import { cn } from "@/lib/utils";
import type { WeekDaySummary } from "@/types/dashboard";

type WeekOverviewProps = {
  week: WeekDaySummary[];
};

export function WeekOverview({ week }: WeekOverviewProps) {
  const maxCount = Math.max(...week.map((d) => d.task_count), 1);

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-base font-semibold tracking-tight">This week</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Tasks due over the next 7 days
        </p>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {week.map((day) => (
          <div key={day.date} className="flex flex-col items-center gap-2">
            <span
              className={cn(
                "text-[11px] font-medium",
                day.is_today ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {day.day_label.slice(0, 2)}
            </span>
            <div className="flex h-16 w-full items-end justify-center">
              <div
                className={cn(
                  "w-full max-w-6 rounded-sm transition-all",
                  day.task_count > 0 ? "bg-foreground/80" : "bg-muted",
                  day.is_today && day.task_count > 0 && "bg-foreground",
                )}
                style={{
                  height: `${Math.max(
                    (day.task_count / maxCount) * 100,
                    day.task_count > 0 ? 16 : 6,
                  )}%`,
                }}
              />
            </div>
            <span
              className={cn(
                "text-sm font-semibold tabular-nums",
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
