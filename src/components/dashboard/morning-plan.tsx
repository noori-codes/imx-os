"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, Sunrise, Timer, X } from "lucide-react";

import {
  isPlanCommitted,
  readDailyPlan,
  writeDailyPlan,
  type DailyPlan,
} from "@/lib/daily-plan";
import { dashboardPhaseFromHour } from "@/lib/dashboard-phase";
import { softCompleteToast } from "@/lib/completion-payoff";
import { cn } from "@/lib/utils";
import type { DashboardHabit, TaskWithContext } from "@/types/dashboard";

const FOCUS_OPTIONS = [25, 50, 90] as const;

type MorningPlanProps = {
  date: string;
  tasks: TaskWithContext[];
  habits: DashboardHabit[];
};

export function MorningPlan({ date, tasks, habits }: MorningPlanProps) {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [phase, setPhase] = useState<"morning" | "afternoon" | "evening" | "night">(
    "afternoon",
  );

  const openTasks = useMemo(
    () => tasks.filter((t) => !t.completed).slice(0, 8),
    [tasks],
  );

  useEffect(() => {
    setPlan(readDailyPlan(date));
    setPhase(dashboardPhaseFromHour(new Date().getHours()));
    function onUpdate(event: Event) {
      const detail = (event as CustomEvent<{ date: string }>).detail;
      if (detail?.date === date) setPlan(readDailyPlan(date));
    }
    window.addEventListener("imx:daily-plan-updated", onUpdate);
    return () => window.removeEventListener("imx:daily-plan-updated", onUpdate);
  }, [date]);

  if (!plan) return null;

  const committed = isPlanCommitted(plan);
  const dismissed = Boolean(plan.dismissedAt);
  const showRitual =
    !dismissed &&
    !committed &&
    (phase === "morning" || phase === "afternoon") &&
    (openTasks.length > 0 || habits.length > 0);

  if (committed) {
    const topDone = plan.topTaskIds.filter((id) =>
      tasks.find((t) => t.id === id && t.completed),
    ).length;
    const topTotal = plan.topTaskIds.length;
    return (
      <section className="dash-plan relative overflow-hidden px-4 py-3.5 sm:px-5">
        <div className="relative z-1 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="dash-panel-eyebrow">Plan</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">
              {topTotal === 0
                ? "Locked in"
                : `${topDone}/${topTotal} top tasks done`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {plan.focusMinutes ? (
              <Link
                href="/focus"
                className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-surface-border bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:border-border"
              >
                <Timer className="size-3.5 opacity-70" aria-hidden />
                {plan.focusMinutes}m focus
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => {
                const next = {
                  ...plan,
                  committedAt: null,
                  dismissedAt: null,
                };
                writeDailyPlan(next);
                setPlan(next);
              }}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Edit
            </button>
          </div>
        </div>
        {topTotal > 0 ? (
          <ul className="relative z-1 mt-3 space-y-1.5">
            {plan.topTaskIds.map((id) => {
              const task = tasks.find((t) => t.id === id);
              if (!task) return null;
              return (
                <li
                  key={id}
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    task.completed
                      ? "text-muted-foreground line-through"
                      : "text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border",
                      task.completed
                        ? "border-foreground/40 bg-foreground text-background"
                        : "border-border/60",
                    )}
                  >
                    {task.completed ? <Check className="size-2.5" /> : null}
                  </span>
                  <span className="truncate">{task.title}</span>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    );
  }

  if (!showRitual) return null;

  function toggleTop(taskId: string) {
    setPlan((prev) => {
      if (!prev) return prev;
      const has = prev.topTaskIds.includes(taskId);
      const topTaskIds = has
        ? prev.topTaskIds.filter((id) => id !== taskId)
        : prev.topTaskIds.length >= 3
          ? prev.topTaskIds
          : [...prev.topTaskIds, taskId];
      const next = { ...prev, topTaskIds };
      writeDailyPlan(next);
      return next;
    });
  }

  function toggleHabit(habitId: string) {
    setPlan((prev) => {
      if (!prev) return prev;
      const has = prev.habitIds.includes(habitId);
      const habitIds = has
        ? prev.habitIds.filter((id) => id !== habitId)
        : [...prev.habitIds, habitId];
      const next = { ...prev, habitIds };
      writeDailyPlan(next);
      return next;
    });
  }

  function setFocusMinutes(minutes: number | null) {
    setPlan((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        focusMinutes: prev.focusMinutes === minutes ? null : minutes,
      };
      writeDailyPlan(next);
      return next;
    });
  }

  function commit() {
    setPlan((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        committedAt: new Date().toISOString(),
        dismissedAt: null,
      };
      writeDailyPlan(next);
      softCompleteToast("Plan set");
      return next;
    });
  }

  function dismiss() {
    setPlan((prev) => {
      if (!prev) return prev;
      const next = { ...prev, dismissedAt: new Date().toISOString() };
      writeDailyPlan(next);
      return next;
    });
  }

  return (
    <section className="dash-plan relative overflow-hidden">
      <div className="relative z-1 border-b border-border/25 px-4 py-3.5 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="dash-panel-eyebrow inline-flex items-center gap-1.5">
              <Sunrise className="size-3 opacity-70" aria-hidden />
              Morning plan
            </p>
            <h3 className="mt-1 text-sm font-semibold tracking-tight text-foreground">
              Set the day
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Top 3, habits, one focus block.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            aria-label="Dismiss morning plan"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="relative z-1 space-y-5 px-5 py-4">
        {openTasks.length > 0 ? (
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Top 3 · {plan.topTaskIds.length}/3
            </p>
            <ul className="mt-2 space-y-1">
              {openTasks.map((task) => {
                const selected = plan.topTaskIds.includes(task.id);
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => toggleTop(task.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors",
                        selected
                          ? "bg-foreground/8 text-foreground"
                          : "text-foreground/85 hover:bg-muted/40",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-full border",
                          selected
                            ? "border-foreground bg-foreground text-background"
                            : "border-border/60",
                        )}
                      >
                        {selected ? <Check className="size-2.5" /> : null}
                      </span>
                      <span className="min-w-0 truncate">{task.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {habits.length > 0 ? (
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Habits for today
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {habits.map((habit) => {
                const selected = plan.habitIds.includes(habit.id);
                return (
                  <button
                    key={habit.id}
                    type="button"
                    onClick={() => toggleHabit(habit.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                      selected
                        ? "border-foreground/25 bg-foreground/8 text-foreground"
                        : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground",
                    )}
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: habit.color || "var(--foreground)" }}
                    />
                    {habit.title}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Focus block
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {FOCUS_OPTIONS.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => setFocusMinutes(minutes)}
                className={cn(
                  "inline-flex h-8 items-center rounded-xl border px-3 text-xs font-medium transition-colors",
                  plan.focusMinutes === minutes
                    ? "border-foreground bg-foreground text-background"
                    : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {minutes}m
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={commit}
            className="inline-flex h-9 items-center rounded-xl bg-foreground px-4 text-xs font-medium text-background transition-opacity hover:opacity-90"
          >
            Lock plan
          </button>
          {plan.focusMinutes ? (
            <Link
              href="/focus"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-surface-border bg-surface px-3.5 text-xs font-medium text-foreground transition-colors hover:border-border"
            >
              <Timer className="size-3.5 opacity-70" aria-hidden />
              Start focus
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
