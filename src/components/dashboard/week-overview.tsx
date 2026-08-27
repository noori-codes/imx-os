import { cn } from "@/lib/utils";
import type { WeekDaySummary } from "@/types/dashboard";

type WeekOverviewProps = {
  week: WeekDaySummary[];
};

function heatSize(count: number, maxCount: number) {
  if (count <= 0) return 10;
  const t = maxCount <= 0 ? 0 : count / maxCount;
  return Math.round(12 + t * 16);
}

function heatOpacity(count: number, maxCount: number) {
  if (count <= 0) return 0.18;
  const t = maxCount <= 0 ? 0 : count / Math.max(maxCount, 1);
  return 0.4 + t * 0.55;
}

export function WeekOverview({ week }: WeekOverviewProps) {
  const maxCount = Math.max(...week.map((d) => d.task_count), 0);
  const total = week.reduce((sum, d) => sum + d.task_count, 0);
  const empty = total === 0;

  return (
    <section className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Week
        </p>
        <p className="text-[11px] tabular-nums text-muted-foreground">
          Sat–Fri
        </p>
      </div>

      <div className="dash-reveal mt-4">
        <p
          className={cn(
            "text-4xl font-medium tracking-tight tabular-nums",
            empty ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {empty ? "—" : total}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {empty ? "Nothing scheduled" : "due this week"}
        </p>
      </div>

      <div className="mt-auto border-t border-border/30 pt-5">
        <div className="dash-stagger grid grid-cols-7 items-end gap-1">
          {week.map((day, index) => {
            const size = heatSize(day.task_count, maxCount);
            const opacity = heatOpacity(day.task_count, maxCount);
            const hasTasks = day.task_count > 0;

            return (
              <div
                key={day.date}
                className="flex min-w-0 flex-col items-center gap-2"
                title={`${day.label}: ${day.task_count} due`}
                style={{ ["--i" as string]: index }}
              >
                <span
                  className={cn(
                    "h-3 text-[10px] leading-none tabular-nums",
                    hasTasks
                      ? "text-muted-foreground"
                      : "text-transparent",
                    day.is_today && hasTasks && "text-foreground/80",
                  )}
                >
                  {hasTasks ? day.task_count : "0"}
                </span>

                <div className="flex h-9 w-full items-center justify-center">
                  <span
                    className={cn(
                      "dash-heat-dot rounded-full bg-foreground",
                      day.is_today && "dash-heat-today",
                    )}
                    style={{
                      width: size,
                      height: size,
                      opacity,
                      ["--i" as string]: index,
                    }}
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
