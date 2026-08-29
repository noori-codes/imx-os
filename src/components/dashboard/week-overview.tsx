"use client";

import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { WeekDaySummary } from "@/types/dashboard";

type WeekOverviewProps = {
  week: WeekDaySummary[];
};

function heatSize(count: number, maxCount: number) {
  if (count <= 0) return 9;
  const t = maxCount <= 0 ? 0 : count / maxCount;
  return Math.round(11 + t * 18);
}

function heatLevel(count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (maxCount <= 0) return 1;
  const t = count / maxCount;
  if (t <= 0.25) return 1;
  if (t <= 0.5) return 2;
  if (t <= 0.75) return 3;
  return 4;
}

export function WeekOverview({ week }: WeekOverviewProps) {
  const arcId = useId().replace(/:/g, "");
  const maxCount = Math.max(...week.map((d) => d.task_count), 0);
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
    <section className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="dash-quad-label">Week</p>
        <p className="text-[11px] tabular-nums text-muted-foreground">
          Sat–Fri
        </p>
      </div>

      <div className="dash-reveal mt-4">
        <p
          className={cn(
            "dash-quad-stat",
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
        <div className="dash-heat-stage">
          <svg
            className="dash-heat-arc"
            viewBox="0 0 100 18"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id={`dash-heat-arc-${arcId}`}
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop
                  offset="0%"
                  stopColor="currentColor"
                  stopOpacity="0.05"
                />
                <stop
                  offset="50%"
                  stopColor="currentColor"
                  stopOpacity="0.22"
                />
                <stop
                  offset="100%"
                  stopColor="currentColor"
                  stopOpacity="0.05"
                />
              </linearGradient>
            </defs>
            <path
              d="M 3 13 Q 50 2 97 13"
              fill="none"
              stroke={`url(#dash-heat-arc-${arcId})`}
              strokeWidth="0.65"
              strokeLinecap="round"
              className="text-foreground"
            />
          </svg>

          <div className="dash-stagger grid grid-cols-7 items-end gap-1">
            {week.map((day, index) => {
              const size = heatSize(day.task_count, maxCount);
              const level = heatLevel(day.task_count, maxCount);
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
                      "h-3 text-[10px] leading-none tabular-nums transition-transform duration-300",
                      hasTasks
                        ? "text-muted-foreground"
                        : "text-transparent",
                      day.is_today && hasTasks && "font-medium text-foreground/85",
                      day.is_today && pulseToday && "dash-heat-count-pop",
                    )}
                  >
                    {hasTasks ? day.task_count : "0"}
                  </span>

                  <div className="dash-heat-jewel-wrap">
                    <span
                      className={cn(
                        "dash-heat-jewel",
                        day.is_today && "dash-heat-jewel-today",
                        day.is_today && pulseToday && "dash-heat-pulse",
                      )}
                      data-level={level}
                      data-today={day.is_today ? "true" : "false"}
                      style={{
                        width: size,
                        height: size,
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
      </div>
    </section>
  );
}
