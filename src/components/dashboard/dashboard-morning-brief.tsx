"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Moon, Sparkles, Target, Timer } from "lucide-react";

import {
  dashboardPhaseFromHour,
  type DashboardPhase,
} from "@/lib/dashboard-phase";
import { cn } from "@/lib/utils";
import { formatFocusMinutes } from "@/types/focus";
import type { TaskWithContext } from "@/types/dashboard";

type DashboardMorningBriefProps = {
  tasks: TaskWithContext[];
  habitsDone: number;
  habitsTotal: number;
  focusMinutes: number;
  focusGoalMinutes: number;
  hasTodayReview: boolean;
  intent: string | null;
};

export function DashboardMorningBrief({
  tasks,
  habitsDone,
  habitsTotal,
  focusMinutes,
  focusGoalMinutes,
  hasTodayReview,
  intent,
}: DashboardMorningBriefProps) {
  const [phase, setPhase] = useState<DashboardPhase>("afternoon");
  const [weekend, setWeekend] = useState(false);

  useEffect(() => {
    const now = new Date();
    setPhase(dashboardPhaseFromHour(now.getHours()));
    const day = now.getDay();
    setWeekend(day === 0 || day === 5 || day === 6);
  }, []);

  const topTasks = tasks.filter((task) => !task.completed).slice(0, 3);
  const habitsLeft = Math.max(0, habitsTotal - habitsDone);
  const focusLeft = Math.max(0, focusGoalMinutes - focusMinutes);
  const focusMet = focusMinutes >= focusGoalMinutes && focusGoalMinutes > 0;
  const showEveningClose =
    (phase === "evening" || phase === "night") && !hasTodayReview;
  const isMorning = phase === "morning";

  const eyebrow = isMorning
    ? "Morning brief"
    : phase === "afternoon"
      ? "Day brief"
      : "Evening close";

  return (
    <section className="dash-panel relative overflow-hidden">
      <div className="dash-panel-glow" aria-hidden="true" />
      <div className="relative z-[1] border-b border-border/40 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="dash-panel-eyebrow">{eyebrow}</p>
            <h3 className="mt-0.5 text-sm font-semibold text-foreground">
              {showEveningClose
                ? "Close the loop"
                : isMorning
                  ? "Start with the sharpest three"
                  : "Still on the table"}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {showEveningClose
                ? intent?.trim()
                  ? "Review is waiting — seal mood and one line."
                  : "A short review turns the day into signal."
                : topTasks.length === 0 && habitsLeft === 0 && focusMet
                  ? "Deck looks clear — keep the streak warm."
                  : isMorning
                    ? "Overdue, due, then Focus — a thin cut of today."
                    : "A thin slice of today, ready to act on."}
            </p>
          </div>
          {showEveningClose ? (
            <Link
              href="/review"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-surface-border bg-foreground px-3 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90"
            >
              <Moon className="size-3.5 opacity-80" aria-hidden />
              Close day
            </Link>
          ) : null}
        </div>
      </div>

      <div className="relative z-[1] grid gap-4 px-5 py-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Top tasks
          </p>
          {topTasks.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground/80">
              Nothing queued —{" "}
              <Link
                href="/tasks?compose=1"
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                capture one
              </Link>
              .
            </p>
          ) : (
            <ol className="mt-2 space-y-2">
              {topTasks.map((task, index) => (
                <li key={task.id} className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-4 shrink-0 text-xs tabular-nums text-muted-foreground/70">
                    {index + 1}
                  </span>
                  <Link
                    href="/tasks?view=today"
                    className="min-w-0 truncate text-sm font-medium text-foreground transition-colors hover:text-foreground/75"
                  >
                    {task.title}
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="grid gap-3 sm:content-start">
          <BriefStat
            icon={Target}
            label="Habits"
            value={
              habitsTotal === 0
                ? "None yet"
                : habitsLeft === 0
                  ? "All checked"
                  : `${habitsLeft} left`
            }
            muted={habitsTotal === 0 || habitsLeft === 0}
            href="/habits"
          />
          <BriefStat
            icon={Timer}
            label="Focus"
            value={
              focusGoalMinutes <= 0
                ? formatFocusMinutes(focusMinutes)
                : focusMet
                  ? "Goal sealed"
                  : `${formatFocusMinutes(focusLeft)} to goal`
            }
            muted={focusMinutes <= 0 && !focusMet}
            href="/focus"
          />
          {!showEveningClose ? (
            <Link
              href="/review"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {hasTodayReview ? "Open review" : "Set today’s intent"}
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          ) : null}
          {weekend ? (
            <Link
              href="/analytics?range=7"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              <Sparkles className="size-3.5 opacity-70" aria-hidden />
              Weekend — seal the week
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function BriefStat({
  icon: Icon,
  label,
  value,
  muted,
  href,
}: {
  icon: typeof Timer;
  label: string;
  value: string;
  muted?: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/40 px-3 py-2.5 transition-colors hover:border-border/70 hover:bg-muted/30"
    >
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-surface-border bg-surface text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "block truncate text-sm font-medium",
            muted ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {value}
        </span>
      </span>
    </Link>
  );
}
