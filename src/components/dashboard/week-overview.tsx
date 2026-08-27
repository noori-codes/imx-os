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
        <p className="text-[11px] tabular-nums text-muted-foreground">
          {empty ? "—" : total}
        </p>
      </div>

      <div className="mt-3 flex flex-1 flex-col border-t border-border/30 pt-4">
        <div className="grid h-full min-h-[7.5rem] flex-1 grid-cols-7 gap-2 sm:gap-2.5">
          {week.map((day, index) => {
            const height = empty
              ? day.is_today
                ? 32
                : 12
              : day.task_count <= 0
                ? 8
                : Math.max(18, Math.round((day.task_count / maxCount) * 100));

            return (
              <div
                key={day.date}
                className="flex min-h-0 min-w-0 flex-col items-center gap-2"
                title={`${day.label}: ${day.task_count} due`}
                style={{ ["--i" as string]: index }}
              >
                <div
                  className={cn(
                    "relative flex min-h-0 w-full flex-1 items-end rounded-lg bg-muted/20 px-1 pb-1",
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
      </div>
    </section>
  );
}
