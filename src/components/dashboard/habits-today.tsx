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
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
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
    <section
      className={cn(
        "dash-panel flex h-full min-h-0 flex-col",
        celebrateSealed && "dash-signal-celebrate",
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/40 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Habits</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {total === 0
              ? "No habits yet"
              : clear
                ? "All sealed"
                : `${done} of ${total} done`}
          </p>
        </div>
        <Link
          href="/habits"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
        </Link>
      </div>

      {total === 0 ? (
        <div className="flex flex-1 flex-col items-start justify-center px-5 py-6">
          <Link
            href="/habits"
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            Add a habit
          </Link>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4 px-5 py-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground transition-[width] duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>

          <ul className="dash-stagger flex flex-wrap gap-3">
            {habits.slice(0, 8).map((habit, index) => (
              <li key={habit.id} style={{ ["--i" as string]: index }}>
                <button
                  type="button"
                  onClick={() =>
                    handleToggle(habit.id, !habit.completed_today)
                  }
                  className="group flex w-17 flex-col items-center gap-1.5"
                  aria-label={
                    habit.completed_today
                      ? `Undo ${habit.title}`
                      : `Complete ${habit.title}`
                  }
                  aria-pressed={habit.completed_today}
                >
                  <span
                    className={cn(
                      "dash-habit-seal relative flex size-10 items-center justify-center rounded-full border-2 transition-all duration-150 group-hover:scale-105 group-active:scale-95",
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
                      "w-full truncate text-center text-[11px] leading-tight text-foreground",
                      habit.completed_today && "text-muted-foreground",
                    )}
                  >
                    {habit.title}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
