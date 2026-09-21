"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { parseDateString, toDateString } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { AnalyticsDayPoint } from "@/types/analytics";
import { formatFocusMinutes } from "@/types/focus";

type LifeConstellationProps = {
  series: AnalyticsDayPoint[];
};

type DayCell = AnalyticsDayPoint & {
  score: number;
  level: 0 | 1 | 2 | 3 | 4;
};

function dayScore(point: AnalyticsDayPoint) {
  let score = 0;
  if (point.focus_minutes >= 50) score += 2;
  else if (point.focus_minutes > 0) score += 1;
  if (point.habits_total > 0) {
    const rate = point.habits_done / point.habits_total;
    if (rate >= 1) score += 2;
    else if (rate >= 0.5) score += 1;
  }
  if (point.tasks_completed > 0) score += 1;
  return score;
}

function levelFromScore(score: number): DayCell["level"] {
  if (score <= 0) return 0;
  if (score === 1) return 1;
  if (score === 2) return 2;
  if (score === 3) return 3;
  return 4;
}

function formatDayLabel(dateStr: string) {
  return parseDateString(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfMondayWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // Mon=0
  d.setDate(d.getDate() - day);
  return d;
}

const LEVEL_CLASS: Record<DayCell["level"], string> = {
  0: "bg-activity-0 ring-1 ring-inset ring-border/40",
  1: "bg-activity-1",
  2: "bg-activity-2",
  3: "bg-activity-3",
  4: "bg-activity-4",
};

export function LifeConstellation({ series }: LifeConstellationProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const days = useMemo<DayCell[]>(() => {
    return [...series]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((point) => {
        const score = dayScore(point);
        return { ...point, score, level: levelFromScore(score) };
      });
  }, [series]);

  const { weeks, monthMarks } = useMemo(() => {
    if (days.length === 0) {
      return { weeks: [] as (DayCell | null)[][], monthMarks: [] as { index: number; label: string }[] };
    }

    const byDate = new Map(days.map((d) => [d.date, d]));
    const first = parseDateString(days[0].date);
    const last = parseDateString(days[days.length - 1].date);
    let cursor = startOfMondayWeek(first);
    const end = addDays(startOfMondayWeek(last), 6);

    const weeks: (DayCell | null)[][] = [];
    const monthMarks: { index: number; label: string }[] = [];
    let prevMonth = -1;

    while (cursor <= end) {
      const week: (DayCell | null)[] = [];
      for (let i = 0; i < 7; i++) {
        const key = toDateString(cursor);
        const inRange = cursor >= first && cursor <= last;
        week.push(inRange ? (byDate.get(key) ?? null) : null);

        if (inRange && i === 0 && cursor.getMonth() !== prevMonth) {
          prevMonth = cursor.getMonth();
          monthMarks.push({
            index: weeks.length,
            label: cursor.toLocaleDateString("en-US", { month: "short" }),
          });
        }
        cursor = addDays(cursor, 1);
      }
      weeks.push(week);
    }

    return { weeks, monthMarks };
  }, [days]);

  const selectedPoint = days.find((day) => day.date === selected) ?? null;
  const sealedDays = days.filter((d) => d.level > 0).length;

  if (days.length === 0) {
    return (
      <section className="dash-panel relative overflow-hidden">
        <div className="dash-panel-glow" aria-hidden />
        <div className="relative z-1 px-5 py-8 text-center">
          <p className="dash-panel-eyebrow">Sky map</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Seal a few days and this map fills in.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="dash-panel relative overflow-hidden">
      <div className="dash-panel-glow" aria-hidden />

      <div className="relative z-1 flex flex-col gap-3 border-b border-border/40 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="dash-panel-eyebrow">Sky map</p>
          <h3 className="mt-0.5 text-sm font-semibold text-foreground">
            Days you showed up
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {sealedDays} active · tap a day for the breakdown
          </p>
        </div>

        <div
          className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
          aria-hidden
        >
          <span>Less</span>
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <span
              key={level}
              className={cn("size-2.5 rounded-[3px]", LEVEL_CLASS[level])}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="relative z-1 overflow-x-auto px-5 py-5">
        <div className="min-w-[18rem]">
          <div
            className="mb-1.5 grid"
            style={{
              gridTemplateColumns: `1.5rem repeat(${weeks.length}, minmax(0.625rem, 1fr))`,
              columnGap: "3px",
            }}
          >
            <span />
            {weeks.map((_, index) => {
              const mark = monthMarks.find((m) => m.index === index);
              return (
                <span
                  key={`month-${index}`}
                  className="truncate text-[10px] font-medium text-muted-foreground/75"
                >
                  {mark?.label ?? ""}
                </span>
              );
            })}
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: `1.5rem repeat(${weeks.length}, minmax(0.625rem, 1fr))`,
              gridTemplateRows: "repeat(7, 0.7rem)",
              gap: "3px",
            }}
            role="grid"
            aria-label="Activity by day"
          >
            {Array.from({ length: 7 }, (_, row) => {
              const rowLabel = ["M", "", "W", "", "F", "", ""][row];
              return (
                <div key={`r-${row}`} className="contents">
                  <span className="flex items-center text-[9px] font-medium leading-none text-muted-foreground/65">
                    {rowLabel}
                  </span>
                  {weeks.map((week, col) => {
                    const cell = week[row];
                    if (!cell) {
                      return (
                        <span
                          key={`empty-${col}-${row}`}
                          className="rounded-[3px] bg-transparent"
                          aria-hidden
                        />
                      );
                    }
                    const active = selected === cell.date;
                    return (
                      <button
                        key={cell.date}
                        type="button"
                        role="gridcell"
                        aria-label={`${formatDayLabel(cell.date)}${cell.level > 0 ? `, intensity ${cell.level}` : ", quiet"}`}
                        aria-pressed={active}
                        title={formatDayLabel(cell.date)}
                        onClick={() =>
                          setSelected((current) =>
                            current === cell.date ? null : cell.date,
                          )
                        }
                        className={cn(
                          "rounded-[3px] transition-[box-shadow,transform] duration-150 hover:scale-110 hover:brightness-[1.06]",
                          LEVEL_CLASS[cell.level],
                          active &&
                            "z-1 ring-2 ring-ring ring-offset-1 ring-offset-background",
                        )}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {selectedPoint ? (
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-surface-border bg-surface px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {formatDayLabel(selectedPoint.date)}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {selectedPoint.level === 0
                  ? "Quiet day — nothing sealed here."
                  : [
                      `${formatFocusMinutes(selectedPoint.focus_minutes)} focus`,
                      selectedPoint.habits_total > 0
                        ? `${selectedPoint.habits_done}/${selectedPoint.habits_total} habits`
                        : null,
                      selectedPoint.tasks_completed > 0
                        ? `${selectedPoint.tasks_completed} task${selectedPoint.tasks_completed === 1 ? "" : "s"}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                href="/focus"
                className="inline-flex h-8 items-center rounded-lg border border-surface-border bg-background/70 px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
              >
                Focus
              </Link>
              <Link
                href="/review"
                className="inline-flex h-8 items-center rounded-lg bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90"
              >
                Review
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
