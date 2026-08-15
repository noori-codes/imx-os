import { cn } from "@/lib/utils";
import {
  addDays,
  parseDateString,
  startOfWeek,
  toDateString,
} from "@/lib/date-utils";
import type { ActivityDay, ActivitySummary } from "@/types/dashboard";

const LEVEL_CLASS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-activity-0",
  1: "bg-activity-1",
  2: "bg-activity-2",
  3: "bg-activity-3",
  4: "bg-activity-4",
};

const CELL = 11;
const GAP = 3;

type ActivityHeatmapProps = {
  activity: ActivitySummary;
};

function formatTooltip(day: ActivityDay) {
  const label = parseDateString(day.date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (day.count === 0) return `No contributions on ${label}`;
  if (day.count === 1) return `1 contribution on ${label}`;
  return `${day.count} contributions on ${label}`;
}

function buildWeeks(days: ActivityDay[]) {
  if (days.length === 0) return [] as (ActivityDay | null)[][];

  const byDate = new Map(days.map((d) => [d.date, d]));
  const first = parseDateString(days[0].date);
  const last = parseDateString(days[days.length - 1].date);
  const gridStart = startOfWeek(first);
  const gridEnd = startOfWeek(last);

  const weeks: (ActivityDay | null)[][] = [];
  let cursor = gridStart;

  while (cursor.getTime() <= gridEnd.getTime()) {
    const week: (ActivityDay | null)[] = [];
    for (let i = 0; i < 7; i += 1) {
      const date = toDateString(addDays(cursor, i));
      if (date < days[0].date || date > days[days.length - 1].date) {
        week.push(null);
      } else {
        week.push(
          byDate.get(date) ?? {
            date,
            count: 0,
            level: 0,
          },
        );
      }
    }
    weeks.push(week);
    cursor = addDays(cursor, 7);
  }

  return weeks;
}

function monthLabels(weeks: (ActivityDay | null)[][]) {
  const labels: { index: number; label: string }[] = [];
  let lastMonth = -1;
  let lastIndex = -99;

  weeks.forEach((week, index) => {
    const firstDay = week.find((d) => d !== null);
    if (!firstDay) return;
    const month = parseDateString(firstDay.date).getMonth();
    if (month === lastMonth) return;

    // Avoid overlapping month labels (GitHub skips tight ones)
    if (index - lastIndex < 3 && labels.length > 0) {
      labels.pop();
    }

    labels.push({
      index,
      label: parseDateString(firstDay.date).toLocaleDateString("en-US", {
        month: "short",
      }),
    });
    lastMonth = month;
    lastIndex = index;
  });

  return labels;
}

export function ActivityHeatmap({ activity }: ActivityHeatmapProps) {
  const weeks = buildWeeks(activity.days);
  const months = monthLabels(weeks);
  const gridWidth = weeks.length * CELL + Math.max(weeks.length - 1, 0) * GAP;

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">
            {activity.total.toLocaleString()} contribution
            {activity.total === 1 ? "" : "s"} in the last year
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {activity.active_days} active days · {activity.current_streak} day
            streak
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>Less</span>
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <div
              key={level}
              className={cn("size-2.5 rounded-sm", LEVEL_CLASS[level])}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto pb-1">
        <div className="inline-flex min-w-full justify-start sm:justify-center">
          <div className="inline-flex gap-2">
            <div
              className="flex w-7 shrink-0 flex-col text-[10px] leading-none text-muted-foreground"
              style={{ gap: GAP, paddingTop: CELL + GAP }}
            >
              {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
                <span
                  key={dayIndex}
                  className="flex items-center"
                  style={{ height: CELL }}
                >
                  {dayIndex === 1
                    ? "Mon"
                    : dayIndex === 3
                      ? "Wed"
                      : dayIndex === 5
                        ? "Fri"
                        : ""}
                </span>
              ))}
            </div>

            <div style={{ width: gridWidth }}>
              <div className="relative mb-1" style={{ height: 14 }}>
                {months.map((month) => (
                  <span
                    key={`${month.label}-${month.index}`}
                    className="absolute top-0 text-[10px] leading-none text-muted-foreground"
                    style={{ left: month.index * (CELL + GAP) }}
                  >
                    {month.label}
                  </span>
                ))}
              </div>

              <div className="flex" style={{ gap: GAP }}>
                {weeks.map((week, weekIndex) => (
                  <div
                    key={weekIndex}
                    className="flex flex-col"
                    style={{ gap: GAP, width: CELL }}
                  >
                    {week.map((day, dayIndex) =>
                      day ? (
                        <div
                          key={day.date}
                          title={formatTooltip(day)}
                          className={cn("rounded-sm", LEVEL_CLASS[day.level])}
                          style={{ width: CELL, height: CELL }}
                        />
                      ) : (
                        <div
                          key={`empty-${weekIndex}-${dayIndex}`}
                          style={{ width: CELL, height: CELL }}
                        />
                      ),
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
