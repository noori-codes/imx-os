import Link from "next/link";
import { Flame } from "lucide-react";

import type { HabitStreakSummary } from "@/types/analytics";

type HabitStreaksListProps = {
  streaks: HabitStreakSummary[];
};

export function HabitStreaksList({ streaks }: HabitStreaksListProps) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Habit streaks</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Current and best streaks · last 30 days rate
          </p>
        </div>
        <Link
          href="/habits"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Manage
        </Link>
      </div>

      {streaks.length === 0 ? (
        <div className="mt-8 flex flex-col items-center py-6 text-center">
          <Flame className="mb-2 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Add habits and check them in to build streaks.
          </p>
          <Link
            href="/habits"
            className="mt-2 text-sm font-medium text-primary hover:underline"
          >
            Go to Habits
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {streaks.map((habit) => (
            <li
              key={habit.id}
              className="rounded-lg border bg-background/60 px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: habit.color }}
                    />
                    <p className="truncate text-sm font-medium">{habit.title}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {habit.days_logged} days logged · {habit.completion_rate}%
                    of last 30
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="inline-flex items-center gap-1 text-sm font-semibold">
                    <Flame
                      className={
                        habit.current_streak > 0
                          ? "size-3.5 text-amber-500"
                          : "size-3.5 text-muted-foreground"
                      }
                    />
                    {habit.current_streak}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    best {habit.longest_streak}
                  </p>
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(habit.completion_rate, 100)}%`,
                    backgroundColor: habit.color,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
