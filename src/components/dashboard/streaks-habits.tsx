"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { Flame } from "lucide-react";

import { toggleHabitToday } from "@/actions/habits";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActivitySummary, DashboardHabit } from "@/types/dashboard";

type StreaksHabitsProps = {
  activity: ActivitySummary;
  habits: DashboardHabit[];
};

type ToggleAction = {
  id: string;
  completed: boolean;
};

function streakMessage(days: number) {
  if (days <= 0) return "Check in once to start a streak.";
  if (days < 7) return "Keep the chain alive.";
  if (days < 30) return "Strong consistency.";
  return "Outstanding streak.";
}

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

export function StreaksHabits({ activity, habits }: StreaksHabitsProps) {
  const [, startTransition] = useTransition();
  const [optimisticHabits, setOptimisticHabits] = useOptimistic(
    habits,
    applyToggle,
  );

  const done = optimisticHabits.filter((h) => h.completed_today).length;
  const ranked = [...optimisticHabits].sort(
    (a, b) =>
      b.current_streak - a.current_streak ||
      b.longest_streak - a.longest_streak,
  );
  const best = Math.max(
    activity.current_streak,
    ...optimisticHabits.map((h) => h.current_streak),
    0,
  );

  function onToggle(habit: DashboardHabit) {
    const next = !habit.completed_today;
    startTransition(async () => {
      setOptimisticHabits({ id: habit.id, completed: next });
      await toggleHabitToday(habit.id, next);
    });
  }

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Streaks & habits
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {streakMessage(best)}
          </p>
        </div>
        <Link
          href="/habits"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Manage
        </Link>
      </div>

      <div className="flex flex-wrap gap-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Activity
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-2xl font-semibold tabular-nums">
            <Flame
              className={cn(
                "size-4",
                activity.current_streak > 0
                  ? "fill-amber-500 text-amber-500"
                  : "text-muted-foreground",
              )}
            />
            {activity.current_streak}
            <span className="text-sm font-medium text-muted-foreground">d</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Today
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums transition-all">
            {done}
            <span className="text-sm font-medium text-muted-foreground">
              /{optimisticHabits.length || 0}
            </span>
          </p>
        </div>
      </div>

      {optimisticHabits.length === 0 ? (
        <Link
          href="/habits"
          className="inline-flex text-sm font-medium hover:underline"
        >
          Add a habit
        </Link>
      ) : (
        <ul className="space-y-1">
          {ranked.slice(0, 8).map((habit) => (
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

              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs tabular-nums transition-colors",
                  habit.current_streak > 0
                    ? "font-semibold text-amber-700 dark:text-amber-300"
                    : "text-muted-foreground",
                )}
              >
                <Flame
                  className={cn(
                    "size-3",
                    habit.current_streak > 0 && "fill-current",
                  )}
                />
                {habit.current_streak}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
