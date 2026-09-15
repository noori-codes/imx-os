"use client";

import { useEffect, useOptimistic, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CheckSquare } from "lucide-react";

import { ProgressRing } from "@/components/dashboard/progress-ring";
import { HabitForm } from "@/components/habits/habit-form";
import { HabitItem } from "@/components/habits/habit-item";
import { HabitViewTabs } from "@/components/habits/habit-view-tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { toDateString } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { HabitView, HabitWithStats } from "@/types/habit";

type PulseStats = {
  doneToday: number;
  activeCount: number;
  bestStreak: number;
  weekRate: number | null;
};

type HabitsBoardProps = {
  habits: HabitWithStats[];
  view: HabitView;
  activeCount: number;
  archivedCount: number;
  pulseStats: PulseStats;
  /** From ⌘K “Add habit” — focus the capture field once. */
  compose?: boolean;
};

type BoardAction =
  | { type: "remove"; id: string }
  | { type: "toggle"; id: string; completed: boolean }
  | { type: "toggleDay"; id: string; date: string; completed: boolean };

function reduceHabits(
  current: HabitWithStats[],
  action: BoardAction,
): HabitWithStats[] {
  if (action.type === "remove") {
    return current.filter((habit) => habit.id !== action.id);
  }

  const today = toDateString(new Date());
  return current.map((habit) => {
    if (habit.id !== action.id) return habit;

    if (action.type === "toggleDay") {
      const week = habit.week.map((day) =>
        day.date === action.date
          ? { ...day, completed: action.completed }
          : day,
      );
      if (action.date !== today) {
        return { ...habit, week };
      }
      let current_streak = habit.current_streak;
      if (!habit.completed_today && action.completed) current_streak += 1;
      if (habit.completed_today && !action.completed) {
        current_streak = Math.max(0, current_streak - 1);
      }
      return {
        ...habit,
        completed_today: action.completed,
        current_streak,
        longest_streak: Math.max(habit.longest_streak, current_streak),
        week,
      };
    }

    let current_streak = habit.current_streak;
    if (!habit.completed_today && action.completed) current_streak += 1;
    if (habit.completed_today && !action.completed) {
      current_streak = Math.max(0, current_streak - 1);
    }

    return {
      ...habit,
      completed_today: action.completed,
      current_streak,
      longest_streak: Math.max(habit.longest_streak, current_streak),
      week: habit.week.map((day) =>
        day.date === today
          ? { ...day, completed: action.completed }
          : day,
      ),
    };
  });
}

function TodayPulse({
  habits,
  pulseStats,
}: {
  habits: HabitWithStats[];
  pulseStats: PulseStats;
}) {
  const done = habits.filter((h) => h.completed_today).length;
  const total = habits.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const clear = total > 0 && done === total;
  const remaining = Math.max(0, total - done);
  const topStreak = habits.reduce(
    (best, habit) => Math.max(best, habit.current_streak),
    0,
  );

  return (
    <section
      className={cn(
        "habits-pulse habits-hero relative overflow-hidden rounded-[1.75rem] border border-border/50 bg-card/85 px-5 py-6 sm:px-7 sm:py-8",
        clear && "habits-pulse-sealed",
      )}
    >
      <div className="habits-pulse-vignette" aria-hidden />
      <div className="habits-pulse-glow" aria-hidden />
      <div className="relative z-[1] flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Daily pulse
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {total === 0
              ? "No rituals yet"
              : clear
                ? "Day sealed"
                : remaining === 1
                  ? "One left"
                  : `${remaining} still open`}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground sm:mx-0">
            {total === 0
              ? "Add a daily habit below and check it off to light the week."
              : clear
                ? "Every active habit is checked in. Keep the streak warm."
                : `Tap today — or an earlier week dot to backfill · longest live streak ${topStreak}d`}
          </p>

          <div className="habits-pulse-instruments mt-5 grid grid-cols-3 gap-4 sm:max-w-sm">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Active
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                {pulseStats.activeCount > 0 ? pulseStats.activeCount : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Best
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                {pulseStats.bestStreak > 0 ? `${pulseStats.bestStreak}d` : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Week
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                {pulseStats.weekRate == null ? "—" : `${pulseStats.weekRate}%`}
              </p>
            </div>
          </div>
        </div>

        <ProgressRing
          value={progress}
          size={128}
          stroke={7}
          sealed={clear}
          featured
          className="mx-auto sm:mx-0"
        >
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
              {total === 0 ? "—" : `${done}/${total}`}
            </p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {clear ? "sealed" : "today"}
            </p>
          </div>
        </ProgressRing>
      </div>
    </section>
  );
}

export function HabitsBoard({
  habits,
  view,
  activeCount,
  archivedCount,
  pulseStats,
  compose = false,
}: HabitsBoardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [focusComposer, setFocusComposer] = useState(compose);
  const [optimisticHabits, dispatchOptimistic] = useOptimistic(
    habits,
    reduceHabits,
  );

  useEffect(() => {
    if (!compose) return;
    setFocusComposer(true);
    const params = new URLSearchParams(window.location.search);
    params.delete("compose");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [compose, pathname, router]);

  useEffect(() => {
    const id = window.location.hash.replace(/^#/, "");
    if (!id.startsWith("habit-")) return;
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, [optimisticHabits.length]);

  const ordered =
    view === "active"
      ? [...optimisticHabits].sort((a, b) => {
          if (a.completed_today === b.completed_today) return 0;
          return a.completed_today ? 1 : -1;
        })
      : optimisticHabits;

  return (
    <div className="flex flex-col gap-6">
      {view === "active" ? (
        <TodayPulse habits={optimisticHabits} pulseStats={pulseStats} />
      ) : (
        <section className="habits-pulse relative overflow-hidden rounded-[1.75rem] border border-border/50 bg-card/85 px-5 py-6 sm:px-7 sm:py-8">
          <div className="habits-pulse-glow" aria-hidden />
          <div className="relative z-[1]">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Archive
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              Shelved rituals
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Restore when you’re ready — streaks stay with the habit.
            </p>
          </div>
        </section>
      )}

      <HabitViewTabs
        active={view}
        activeCount={activeCount}
        archivedCount={archivedCount}
      />

      {view === "active" ? (
        <div
          id="habits-composer"
          className="habits-composer relative overflow-hidden rounded-2xl border border-border/40 bg-card/70 p-4 sm:p-5"
        >
          <div className="habits-composer-glow" aria-hidden />
          <div className="relative z-[1]">
            <div className="mb-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                New ritual
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Something small you can seal every day. Press{" "}
                <kbd className="rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px]">
                  N
                </kbd>{" "}
                to focus.
              </p>
            </div>
            <HabitForm variant="composer" autoFocusTitle={focusComposer} />
          </div>
        </div>
      ) : null}

      {ordered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={view === "archived" ? "No archived habits" : "No habits yet"}
          description={
            view === "archived"
              ? "Archived habits will show up here."
              : "Add a daily habit above, then check it off to build a streak."
          }
          className="py-16"
        >
          {view === "active" ? (
            <Button
              type="button"
              className="mt-5"
              onClick={() => {
                const root = document.getElementById("habits-composer");
                root?.scrollIntoView({ behavior: "smooth", block: "center" });
                root
                  ?.querySelector<HTMLInputElement>("input[name=title]")
                  ?.focus({ preventScroll: true });
              }}
            >
              Start a ritual
            </Button>
          ) : (
            <Button asChild variant="outline" className="mt-5">
              <Link href="/habits">Back to active</Link>
            </Button>
          )}
        </EmptyState>
      ) : (
        <ul className="habits-grid grid gap-3 sm:grid-cols-2">
          {ordered.map((habit, index) => (
            <HabitItem
              key={habit.id}
              habit={habit}
              index={index}
              archivedView={view === "archived"}
              onOptimisticRemove={(id) =>
                dispatchOptimistic({ type: "remove", id })
              }
              onOptimisticToggle={(id, completed) =>
                dispatchOptimistic({ type: "toggle", id, completed })
              }
              onOptimisticToggleDay={(id, date, completed) =>
                dispatchOptimistic({ type: "toggleDay", id, date, completed })
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}
