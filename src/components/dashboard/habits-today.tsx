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

export function HabitsToday({ habits }: HabitsTodayProps) {
  const [, startTransition] = useTransition();
  const [optimisticHabits, setOptimisticHabits] = useOptimistic(
    habits,
    applyToggle,
  );

  const done = optimisticHabits.filter((h) => h.completed_today).length;
  const total = optimisticHabits.length;
  const clear = total > 0 && done === total;

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
        </p>
        <Link
          href="/habits"
          className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          All
        </Link>
      </div>

      <div className="dash-reveal mt-4">
        <p
          className={cn(
            "text-4xl font-medium tracking-tight tabular-nums",
            total === 0 || clear
              ? "text-muted-foreground"
              : "text-foreground",
          )}
        >
          {total === 0 ? "—" : (
            <>
              {done}
              <span className="text-2xl text-muted-foreground/60">/{total}</span>
            </>
          )}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {total === 0 ? "No habits yet" : clear ? "Sealed" : "done today"}
        </p>
      </div>

      {total === 0 ? (
        <Link
          href="/habits"
          className="mt-auto pt-6 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Add a habit
        </Link>
      ) : (
        <ul className="dash-stagger mt-5 flex flex-wrap gap-x-3 gap-y-4 border-t border-border/30 pt-5">
          {optimisticHabits.slice(0, 8).map((habit, index) => (
            <li
              key={habit.id}
              className="w-17 sm:w-18"
              style={{ ["--i" as string]: index }}
            >
              <button
                type="button"
                onClick={() => onToggle(habit)}
                className="group flex w-full flex-col items-center gap-1.5"
                aria-label={
                  habit.completed_today
                    ? `Undo ${habit.title}`
                    : `Complete ${habit.title}`
                }
                aria-pressed={habit.completed_today}
              >
                <span
                  className={cn(
                    "dash-habit-seal flex size-11 items-center justify-center rounded-full border-2 transition-transform duration-150 group-hover:scale-105 group-active:scale-95 sm:size-12",
                    habit.completed_today && "text-white",
                  )}
                  style={
                    habit.completed_today
                      ? {
                          backgroundColor: habit.color,
                          borderColor: habit.color,
                          boxShadow: `0 0 0 3px color-mix(in oklab, ${habit.color} 28%, transparent)`,
                        }
                      : { borderColor: habit.color }
                  }
                >
                  <span
                    className={cn(
                      "text-sm font-bold leading-none transition-all duration-150",
                      habit.completed_today
                        ? "scale-100 opacity-100"
                        : "scale-50 opacity-0",
                    )}
                  >
                    ✓
                  </span>
                </span>
                <span
                  className={cn(
                    "w-full truncate text-center text-[11px] leading-tight text-foreground",
                    habit.completed_today && "text-muted-foreground",
                  )}
                >
                  {habit.title}
                </span>
                <span className="h-3 text-[10px] leading-none tabular-nums text-muted-foreground/70">
                  {habit.current_streak > 0 ? `${habit.current_streak}d` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
