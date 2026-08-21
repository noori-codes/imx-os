import { parseDateString } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import {
  formatFocusMinutes,
  type FocusOverviewStats,
  type FocusWeekDay,
} from "@/types/focus";

const LEVEL_CLASS: Record<FocusWeekDay["level"], string> = {
  0: "bg-activity-0",
  1: "bg-activity-1",
  2: "bg-activity-2",
  3: "bg-activity-3",
  4: "bg-activity-4",
};

type FocusStatsProps = {
  stats: FocusOverviewStats;
};

export function FocusStats({ stats }: FocusStatsProps) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "short" });

  return (
    <div className="space-y-3 border-b border-border/60 pb-4">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>
          Today{" "}
          <span className="tabular-nums text-foreground">{today}</span>
        </span>
        <span>
          Sessions{" "}
          <span className="tabular-nums text-foreground">{stats.sessions}</span>
        </span>
        <span>
          Focused{" "}
          <span className="tabular-nums text-foreground">
            {formatFocusMinutes(stats.focus_minutes)}
          </span>
        </span>
        <span>
          Streak{" "}
          <span className="tabular-nums text-foreground">
            {stats.current_streak}d
          </span>
          {stats.longest_streak > 0 ? (
            <span className="text-muted-foreground">
              {" "}
              · best {stats.longest_streak}d
            </span>
          ) : null}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Last 7 days</p>
        <div className="flex items-end gap-1.5" aria-label="Focus week heatmap">
          {stats.week.map((day) => {
            const label = parseDateString(day.date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            const title =
              day.minutes <= 0
                ? `No focus on ${label}`
                : `${formatFocusMinutes(day.minutes)} on ${label}`;

            return (
              <div key={day.date} className="flex flex-col items-center gap-1">
                <span
                  title={title}
                  className={cn(
                    "size-3.5 rounded-sm",
                    LEVEL_CLASS[day.level],
                  )}
                  aria-label={title}
                />
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {parseDateString(day.date).toLocaleDateString("en-US", {
                    weekday: "narrow",
                  })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
