"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";

import { toggleHabitToday } from "@/actions/habits";
import { cn } from "@/lib/utils";
import type { DashboardHabit } from "@/types/dashboard";

type HabitsTodayProps = {
  habits: DashboardHabit[];
};

type ToggleAction = {
  id: string;
  completed: boolean;
};

function applyToggle(
  habits: DashboardHabit[],
  action: ToggleAction,
): DashboardHabit[] {
  return habits.map((habit) => {
    if (habit.id !== action.id) return habit;

    const wasDone = habit.completed_today;
    const willBeDone = action.completed;
    let current_streak = habit.current_streak;

    if (!wasDone && willBeDone) current_streak += 1;
    if (wasDone && !willBeDone) current_streak = Math.max(0, current_streak - 1);

    return {
      ...habit,
      completed_today: willBeDone,
      current_streak,
      longest_streak: Math.max(habit.longest_streak, current_streak),
    };
  });
}

function GhostHabits() {
  return (
    <div className="relative mt-5">
      <div
        className="dash-ghost pointer-events-none flex flex-wrap gap-2.5"
        aria-hidden="true"
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="size-9 rounded-full border border-dashed border-border/70"
            style={{ opacity: 1 - i * 0.12 }}
          />
        ))}
      </div>
      <Link
        href="/habits"
        className="mt-4 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Add a habit
      </Link>
    </div>
  );
}

export function HabitsToday({ habits }: HabitsTodayProps) {
  const [, startTransition] = useTransition();
  const [optimisticHabits, setOptimisticHabits] = useOptimistic(
    habits,
    applyToggle,
  );

  const done = optimisticHabits.filter((h) => h.completed_today).length;

  function onToggle(habit: DashboardHabit) {
    const next = !habit.completed_today;
    startTransition(async () => {
      setOptimisticHabits({ id: habit.id, completed: next });
      await toggleHabitToday(habit.id, next);
    });
  }

  return (
    <section className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Habits
          {optimisticHabits.length > 0 ? (
            <span className="ml-2 tabular-nums text-muted-foreground/80">
              {done}/{optimisticHabits.length}
            </span>
          ) : null}
        </p>
        <Link
          href="/habits"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          All
        </Link>
      </div>

      {optimisticHabits.length === 0 ? (
        <GhostHabits />
      ) : (
        <ul className="dash-stagger mt-4 space-y-1">
          {optimisticHabits.slice(0, 8).map((habit, index) => (
            <li
              key={habit.id}
              className="flex items-center gap-3 rounded-lg px-1 py-2 transition-colors hover:bg-muted/30"
              style={{ ["--i" as string]: index }}
            >
              <button
                type="button"
                onClick={() => onToggle(habit)}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-transform duration-150",
                  habit.completed_today
                    ? "text-white"
                    : "hover:scale-105 active:scale-95",
                )}
                style={
                  habit.completed_today
                    ? {
                        backgroundColor: habit.color,
                        borderColor: habit.color,
                        boxShadow: `0 0 0 3px color-mix(in oklab, ${habit.color} 22%, transparent)`,
                      }
                    : { borderColor: habit.color }
                }
                aria-label={
                  habit.completed_today
                    ? `Undo ${habit.title}`
                    : `Complete ${habit.title}`
                }
                aria-pressed={habit.completed_today}
              >
                <span
                  className={cn(
                    "text-[10px] font-bold transition-all duration-150",
                    habit.completed_today
                      ? "scale-100 opacity-100"
                      : "scale-50 opacity-0",
                  )}
                >
                  ✓
                </span>
              </button>

              <p
                className={cn(
                  "min-w-0 flex-1 truncate text-sm text-foreground",
                  habit.completed_today &&
                    "text-muted-foreground line-through",
                )}
              >
                {habit.title}
              </p>

              {habit.current_streak > 0 ? (
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {habit.current_streak}d
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
