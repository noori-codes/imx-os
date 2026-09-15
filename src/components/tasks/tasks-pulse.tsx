import Link from "next/link";
import { ArrowUpRight, Timer } from "lucide-react";

import { ProgressRing } from "@/components/dashboard/progress-ring";
import { cn } from "@/lib/utils";
import { isOverdue, isToday } from "@/lib/date-utils";
import type { TaskWithContext } from "@/types/task";

export type TasksPulseStats = {
  openCount: number;
  overdueCount: number;
  doneToday: number;
  todayOpen: number;
  focusMinutes: number;
};

type TasksPulseProps = {
  stats: TasksPulseStats;
  focusNext?: TaskWithContext | null;
};

function pulseCopy(stats: TasksPulseStats) {
  const { openCount, overdueCount, doneToday, todayOpen } = stats;

  if (openCount === 0) {
    return {
      title: doneToday > 0 ? "Deck clear" : "Nothing open",
      body:
        doneToday > 0
          ? "Everything scheduled is sealed. Capture what’s next when you’re ready."
          : "Capture a task below — or press N to start writing.",
      clear: true,
    };
  }

  if (overdueCount > 0) {
    return {
      title:
        overdueCount === 1
          ? "One overdue"
          : `${overdueCount} overdue`,
      body:
        todayOpen > overdueCount
          ? `Plus ${todayOpen - overdueCount} still due today. Knock the late ones first.`
          : "Clear the late list before anything new piles on.",
      clear: false,
    };
  }

  if (todayOpen > 0) {
    return {
      title: todayOpen === 1 ? "One left today" : `${todayOpen} due today`,
      body:
        doneToday > 0
          ? `${doneToday} already sealed · keep the streak of finishes going.`
          : "Schedule with chips, then start focus on the sharpest one.",
      clear: false,
    };
  }

  return {
    title: openCount === 1 ? "One open" : `${openCount} open`,
    body: "Nothing due today — pick a focus next or schedule something into Today.",
    clear: false,
  };
}

export function TasksPulse({ stats, focusNext }: TasksPulseProps) {
  const copy = pulseCopy(stats);
  const todayDenom = stats.doneToday + stats.todayOpen;
  const progress =
    todayDenom > 0 ? Math.round((stats.doneToday / todayDenom) * 100) : 0;
  const ringClear = stats.todayOpen === 0 && todayDenom > 0;

  const nextOverdue = Boolean(
    focusNext?.due_date && isOverdue(focusNext.due_date),
  );
  const nextToday = Boolean(
    focusNext?.due_date && isToday(focusNext.due_date),
  );

  return (
    <section
      className={cn(
        "tasks-pulse relative overflow-hidden rounded-[1.75rem] border border-border/50 bg-card/85 px-5 py-6 sm:px-7 sm:py-8",
        copy.clear && "tasks-pulse-sealed",
      )}
    >
      <div className="tasks-pulse-vignette" aria-hidden />
      <div className="tasks-pulse-glow" aria-hidden />

      <div className="relative z-1 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Command deck
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {copy.title}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground sm:mx-0">
            {copy.body}
          </p>

          <div className="tasks-pulse-instruments mt-5 grid grid-cols-3 gap-4 sm:max-w-sm">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Open
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                {stats.openCount > 0 ? stats.openCount : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Overdue
              </p>
              <p
                className={cn(
                  "mt-1 text-lg font-semibold tabular-nums tracking-tight",
                  stats.overdueCount > 0 && "text-destructive",
                )}
              >
                {stats.overdueCount > 0 ? stats.overdueCount : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Focus
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                {stats.focusMinutes > 0 ? `${stats.focusMinutes}m` : "—"}
              </p>
            </div>
          </div>

          {focusNext ? (
            <div className="mt-5 flex flex-col items-center gap-3 sm:items-start">
              <p className="text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground/80">
                  Focus next
                </span>
                {" · "}
                {nextOverdue
                  ? "Overdue"
                  : nextToday
                    ? "Due today"
                    : focusNext.context ?? "Best open task"}
              </p>
              <div className="flex max-w-full flex-wrap items-center justify-center gap-2 sm:justify-start">
                <p className="truncate text-sm font-medium text-foreground">
                  {focusNext.title}
                </p>
                <Link
                  href={`/focus?task=${focusNext.id}`}
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-foreground px-3.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
                >
                  <Timer className="size-3.5" />
                  Start
                  <ArrowUpRight className="size-3 opacity-70" />
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        <ProgressRing
          value={progress}
          size={128}
          stroke={7}
          sealed={ringClear || copy.clear}
          featured
          className="mx-auto sm:mx-0"
        >
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
              {todayDenom === 0 ? "—" : `${stats.doneToday}/${todayDenom}`}
            </p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {ringClear || copy.clear ? "sealed" : "today"}
            </p>
          </div>
        </ProgressRing>
      </div>
    </section>
  );
}
