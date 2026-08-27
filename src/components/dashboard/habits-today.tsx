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
    <div className="flex flex-1 flex-col">
      <ul className="pointer-events-none border-t border-border/30" aria-hidden="true">
        {[68, 54, 40].map((width, i) => (
          <li
            key={i}
            className="flex items-center gap-3 border-b border-border/20 py-3 last:border-b-0"
            style={{ opacity: 0.42 - i * 0.1 }}
          >
            <span className="size-4 shrink-0 rounded-full border border-border/50" />
            <span
              className="h-2.5 rounded-full bg-muted"
              style={{ width: `${width}%` }}
            />
          </li>
        ))}
      </ul>
      <Link
        href="/habits"
        className="mt-auto pt-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
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
        <div className="flex items-baseline gap-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Habits
          </p>
          {optimisticHabits.length > 0 ? (
            <span className="text-[11px] tabular-nums text-muted-foreground/70">
              {done}/{optimisticHabits.length}
            </span>
          ) : null}
        </div>
        <Link
          href="/habits"
          className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          All
        </Link>
      </div>

      {optimisticHabits.length === 0 ? (
        <div className="mt-3 flex min-h-0 flex-1 flex-col">
          <GhostHabits />
        </div>
      ) : (
        <ul className="dash-stagger mt-3 min-h-0 flex-1 border-t border-border/30">
          {optimisticHabits.slice(0, 6).map((habit, index) => (
            <li
              key={habit.id}
              className="flex items-center gap-3 border-b border-border/30 py-3 last:border-b-0"
              style={{ ["--i" as string]: index }}
            >
              <button
                type="button"
                onClick={() => onToggle(habit)}
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-transform duration-150",
                  habit.completed_today
                    ? "text-white"
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
                    "text-[9px] font-bold leading-none transition-all duration-150",
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
                <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
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
