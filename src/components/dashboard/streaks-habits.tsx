import Link from "next/link";
import { Flame } from "lucide-react";

import { toggleHabitToday } from "@/actions/habits";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActivitySummary, DashboardHabit } from "@/types/dashboard";

type StreaksHabitsProps = {
  activity: ActivitySummary;
  habits: DashboardHabit[];
};

function streakMessage(days: number) {
  if (days <= 0) return "Check in once to start a streak.";
  if (days < 7) return "Keep the chain alive.";
  if (days < 30) return "Strong consistency.";
  return "Outstanding streak.";
}

export function StreaksHabits({ activity, habits }: StreaksHabitsProps) {
  const done = habits.filter((h) => h.completed_today).length;
  const ranked = [...habits].sort(
    (a, b) =>
      b.current_streak - a.current_streak ||
      b.longest_streak - a.longest_streak,
  );
  const best = Math.max(
    activity.current_streak,
    ...habits.map((h) => h.current_streak),
    0,
  );

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
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {done}
            <span className="text-sm font-medium text-muted-foreground">
              /{habits.length || 0}
            </span>
          </p>
        </div>
      </div>

      {habits.length === 0 ? (
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
              <form
                action={toggleHabitToday.bind(
                  null,
                  habit.id,
                  !habit.completed_today,
                )}
              >
                <Button
                  type="submit"
                  variant="outline"
                  size="icon"
                  className={cn(
                    "size-7 shrink-0 rounded-full border-2 transition-colors",
                    habit.completed_today && "text-white",
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
                >
                  {habit.completed_today ? (
                    <span className="text-[10px] font-bold">✓</span>
                  ) : null}
                </Button>
              </form>

              <p
                className={cn(
                  "min-w-0 flex-1 truncate text-sm",
                  habit.completed_today &&
                    "text-muted-foreground line-through",
                )}
              >
                {habit.title}
              </p>

              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs tabular-nums",
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
