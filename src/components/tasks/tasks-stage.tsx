"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { TASK_VIEWS, type TaskView } from "@/types/task";

type TasksStageProps = {
  view: TaskView;
  openCount: number;
  overdueCount: number;
  counts: Record<TaskView, number>;
  nextDueLabel?: string | null;
};

type Phase = "morning" | "afternoon" | "evening" | "night";

function phaseFromHour(hour: number): Phase {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function formatTodayLabel(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function useCountUp(target: number) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target <= 0) {
      setValue(0);
      return;
    }
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      return;
    }
    let frame = 0;
    const duration = 640;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return value;
}

function viewHref(view: TaskView) {
  return view === "today" ? "/tasks" : `/tasks?view=${view}`;
}

function stageCopy(
  view: TaskView,
  openCount: number,
  overdueCount: number,
  nextDueLabel: string | null | undefined,
) {
  switch (view) {
    case "today":
      return {
        label: "Open today",
        detail:
          overdueCount > 0
            ? `${overdueCount} overdue`
            : openCount === 0
              ? "Clear runway"
              : "Ready when you are",
        date: formatTodayLabel(),
      };
    case "inbox":
      return {
        label: "Unfiled",
        detail: openCount === 0 ? "Inbox zero" : "Capture & sort later",
        date: "Inbox",
      };
    case "upcoming":
      return {
        label: "Scheduled",
        detail: nextDueLabel ? `Next · ${nextDueLabel}` : "Nothing ahead yet",
        date: "Upcoming",
      };
    case "all":
      return {
        label: "Open",
        detail: openCount === 0 ? "All clear" : "Across every list",
        date: "Everything",
      };
  }
}

export function TasksStage({
  view,
  openCount,
  overdueCount,
  counts,
  nextDueLabel = null,
}: TasksStageProps) {
  const [phase, setPhase] = useState<Phase>("afternoon");
  const display = useCountUp(openCount);
  const copy = stageCopy(view, openCount, overdueCount, nextDueLabel);

  useEffect(() => {
    setPhase(phaseFromHour(new Date().getHours()));
  }, []);

  return (
    <section className="dash-stage px-5 py-6 sm:px-8 sm:py-8" data-phase={phase}>
      <div className="dash-stage-glow" aria-hidden="true" />
      <div className="dash-stage-glow-secondary" aria-hidden="true" />

      <div className="relative z-[1] space-y-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="dash-reveal min-w-0 text-center sm:text-left">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {copy.date}
            </p>
            <div className="mt-3 flex flex-col items-center gap-1 sm:items-start">
              <p
                className={cn(
                  "text-5xl font-medium tracking-tight tabular-nums sm:text-6xl",
                  openCount > 0 ? "text-foreground" : "text-muted-foreground",
                  overdueCount > 0 && view === "today" && "text-destructive",
                )}
              >
                {display}
              </p>
              <p className="text-sm text-muted-foreground">{copy.label}</p>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{copy.detail}</p>
          </div>

          <div className="dash-reveal dash-reveal-delay-1 flex justify-center sm:justify-end">
            <div
              className="inline-flex max-w-full overflow-x-auto rounded-full bg-background/50 p-1 backdrop-blur-sm"
              role="tablist"
              aria-label="Task views"
            >
              {TASK_VIEWS.map((item) => {
                const active = item.id === view;
                const count = counts[item.id];
                return (
                  <Link
                    key={item.id}
                    href={viewHref(item.id)}
                    scroll={false}
                    role="tab"
                    aria-selected={active}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1.5 text-xs transition-colors",
                      active
                        ? "bg-foreground font-medium text-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                    {count > 0 ? (
                      <span className="ml-1 tabular-nums opacity-70">
                        {count}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
