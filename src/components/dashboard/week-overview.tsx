"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { WeekDaySummary } from "@/types/dashboard";

type WeekOverviewProps = {
  week: WeekDaySummary[];
};

export function WeekOverview({ week }: WeekOverviewProps) {
  const maxCount = Math.max(...week.map((d) => d.task_count), 1);
  const total = week.reduce((sum, d) => sum + d.task_count, 0);
  const empty = total === 0;
  const todayCount = week.find((d) => d.is_today)?.task_count ?? 0;
  const [pulseToday, setPulseToday] = useState(false);
  const prevTodayCount = useRef(todayCount);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      prevTodayCount.current = todayCount;
      return;
    }
    if (prevTodayCount.current !== todayCount) {
      setPulseToday(true);
      const timer = window.setTimeout(() => setPulseToday(false), 540);
      prevTodayCount.current = todayCount;
      return () => window.clearTimeout(timer);
    }
  }, [todayCount]);

  return (
    <section className="dash-panel">
      <div className="flex items-center justify-between gap-3 border-b border-border/40 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Week load</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {empty ? "Nothing scheduled" : `${total} due this week`}
          </p>
        </div>
        <Link
          href="/tasks"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Tasks
        </Link>
      </div>

      <div className="px-5 py-5">
        <div className="dash-stagger grid h-36 grid-cols-7 items-end gap-2 sm:gap-3">
          {week.map((day, index) => {
            const heightPct = empty
              ? 8
              : Math.max(8, Math.round((day.task_count / maxCount) * 100));
            const hasTasks = day.task_count > 0;

            return (
              <div
                key={day.date}
                className="flex h-full min-w-0 flex-col items-center justify-end gap-2"
                title={`${day.label}: ${day.task_count} due`}
                style={{ ["--i" as string]: index }}
              >
                <span
                  className={cn(
                    "text-[10px] tabular-nums leading-none",
                    hasTasks
                      ? "text-muted-foreground"
                      : "text-muted-foreground/35",
                    day.is_today && hasTasks && "font-medium text-foreground",
                    day.is_today && pulseToday && "dash-heat-count-pop",
                  )}
                >
                  {day.task_count}
                </span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className={cn(
                      "dash-bar-rise mx-auto w-full max-w-9 rounded-md transition-colors",
                      day.is_today
                        ? "bg-foreground"
                        : hasTasks
                          ? "bg-foreground/35"
                          : "bg-muted",
                      day.is_today && pulseToday && "dash-week-today",
                    )}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "text-[11px] tabular-nums text-muted-foreground",
                    day.is_today && "font-semibold text-foreground",
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
