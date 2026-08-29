"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { DashboardHabit } from "@/types/dashboard";

type HabitsTodayProps = {
  habits: DashboardHabit[];
  onToggle: (habitId: string, completed: boolean) => void;
};

export function HabitsToday({ habits, onToggle }: HabitsTodayProps) {
  const done = habits.filter((h) => h.completed_today).length;
  const total = habits.length;
  const clear = total > 0 && done === total;
  const [burstId, setBurstId] = useState<string | null>(null);
  const [celebrateSealed, setCelebrateSealed] = useState(false);
  const prevClear = useRef(clear);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      prevClear.current = clear;
      return;
    }
    if (clear && !prevClear.current) {
      setCelebrateSealed(true);
      const timer = window.setTimeout(() => setCelebrateSealed(false), 720);
      prevClear.current = clear;
      return () => window.clearTimeout(timer);
    }
    prevClear.current = clear;
  }, [clear]);

  function handleToggle(habitId: string, completed: boolean) {
    if (completed) {
      setBurstId(habitId);
      window.setTimeout(() => setBurstId(null), 460);
    }
    onToggle(habitId, completed);
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

      <div
        className={cn(
          "dash-reveal mt-4",
          celebrateSealed && "dash-signal-celebrate",
        )}
      >
        <p
          className={cn(
            "dash-signal-value text-4xl font-medium tracking-tight tabular-nums transition-all duration-200",
            total === 0 || clear
              ? celebrateSealed
                ? "text-foreground"
                : "text-muted-foreground"
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
          {habits.slice(0, 8).map((habit, index) => (
            <li
              key={habit.id}
              className="w-17 sm:w-18"
              style={{ ["--i" as string]: index }}
            >
              <button
                type="button"
                onClick={() => handleToggle(habit.id, !habit.completed_today)}
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
                    "dash-habit-seal relative flex size-11 items-center justify-center rounded-full border-2 transition-all duration-150 group-hover:scale-105 group-active:scale-95 sm:size-12",
                    habit.completed_today && "text-white",
                    burstId === habit.id && "dash-habit-seal-burst",
                  )}
                  data-burst={burstId === habit.id ? "true" : undefined}
                  style={
                    habit.completed_today
                      ? {
                          backgroundColor: habit.color,
                          borderColor: habit.color,
                          boxShadow: `0 0 0 3px color-mix(in oklab, ${habit.color} 28%, transparent)`,
                          ["--habit-burst" as string]: `color-mix(in oklab, ${habit.color} 45%, transparent)`,
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
                    "w-full truncate text-center text-[11px] leading-tight text-foreground transition-colors duration-150",
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
