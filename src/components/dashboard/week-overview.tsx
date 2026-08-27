import { cn } from "@/lib/utils";
import type { WeekDaySummary } from "@/types/dashboard";

type WeekOverviewProps = {
  week: WeekDaySummary[];
};

export function WeekOverview({ week }: WeekOverviewProps) {
  const maxCount = Math.max(...week.map((d) => d.task_count), 1);
  const total = week.reduce((sum, d) => sum + d.task_count, 0);

  return (
    <section className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Week
        </p>
        <p className="text-xs tabular-nums text-muted-foreground">{total}</p>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-2 sm:gap-2.5">
        {week.map((day) => {
          const height =
            day.task_count <= 0
              ? 8
              : Math.max(16, Math.round((day.task_count / maxCount) * 100));
          return (
            <div
              key={day.date}
              className="flex min-w-0 flex-col items-center gap-1.5"
              title={`${day.label}: ${day.task_count} due`}
            >
              <div className="relative flex h-16 w-full items-end rounded-md bg-muted/25 px-1 pb-1 sm:h-20">
                <div
                  className={cn(
                    "w-full min-h-[3px] rounded-[3px] transition-all",
                    day.is_today
                      ? "bg-foreground"
                      : day.task_count > 0
                        ? "bg-foreground/55"
                        : "bg-foreground/15",
                  )}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-[11px] tabular-nums text-muted-foreground",
                  day.is_today && "font-medium text-foreground",
                )}
              >
                {day.day_label.slice(0, 2)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
