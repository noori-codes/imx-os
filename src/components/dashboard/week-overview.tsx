import { cn } from "@/lib/utils";
import type { WeekDaySummary } from "@/types/dashboard";

type WeekOverviewProps = {
  week: WeekDaySummary[];
};

export function WeekOverview({ week }: WeekOverviewProps) {
  const maxCount = Math.max(...week.map((d) => d.task_count), 1);
  const total = week.reduce((sum, d) => sum + d.task_count, 0);
  const empty = total === 0;

  return (
    <section className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Week
        </p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {empty ? "—" : total}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-2 sm:gap-2.5">
        {week.map((day, index) => {
          const height = empty
            ? day.is_today
              ? 28
              : 10
            : day.task_count <= 0
              ? 8
              : Math.max(18, Math.round((day.task_count / maxCount) * 100));

          return (
            <div
              key={day.date}
              className="flex min-w-0 flex-col items-center gap-2"
              title={`${day.label}: ${day.task_count} due`}
              style={{ ["--i" as string]: index }}
            >
              <div
                className={cn(
                  "relative flex h-20 w-full items-end rounded-lg bg-muted/20 px-1 pb-1 sm:h-24",
                  day.is_today && "dash-week-today bg-muted/35",
                  empty && !day.is_today && "opacity-50",
                )}
              >
                <div
                  className={cn(
                    "dash-bar-rise w-full min-h-[3px] rounded-[4px]",
                    day.is_today
                      ? "bg-foreground"
                      : day.task_count > 0
                        ? "bg-foreground/55"
                        : "bg-foreground/12",
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
