"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { Flame } from "lucide-react";

import { toggleHabitToday } from "@/actions/habits";
import { Button } from "@/components/ui/button";
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

  function onToggle(habit: DashboardHabit) {
    const next = !habit.completed_today;
    startTransition(async () => {
      setOptimisticHabits({ id: habit.id, completed: next });
      await toggleHabitToday(habit.id, next);
    });
  }

  return (
    <section className="imx-panel imx-panel-tight h-full">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Habits</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {optimisticHabits.length === 0
              ? "Build a daily rhythm"
              : `${done}/${optimisticHabits.length} done`}
          </p>
        </div>
        <Link
          href="/habits"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Manage
        </Link>
      </div>

      {optimisticHabits.length === 0 ? (
        <Link
          href="/habits"
          className="mt-5 inline-flex text-sm font-medium hover:underline"
        >
          Add a habit
        </Link>
      ) : (
        <ul className="mt-4 space-y-0.5">
          {optimisticHabits.slice(0, 8).map((habit) => (
            <li key={habit.id} className="flex items-center gap-3 py-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onToggle(habit)}
                className={cn(
                  "size-7 shrink-0 rounded-full border-2 transition-all duration-150",
                  habit.completed_today
                    ? "scale-100 text-white"
                    : "hover:scale-105 active:scale-95",
                )}
                style={
                  habit.completed_today
                    ? {
                        backgroundColor: habit.color,
                        borderColor: habit.color,
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
              </Button>

              <p
                className={cn(
                  "min-w-0 flex-1 truncate text-sm transition-colors",
                  habit.completed_today &&
                    "text-muted-foreground line-through",
                )}
              >
                {habit.title}
              </p>

              {habit.current_streak > 0 ? (
                <span className="inline-flex items-center gap-0.5 text-xs font-medium tabular-nums text-amber-700 dark:text-amber-300">
                  <Flame className="size-3 fill-current" />
                  {habit.current_streak}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
