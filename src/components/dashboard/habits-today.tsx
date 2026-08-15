import Link from "next/link";
import { Flame } from "lucide-react";

import { toggleHabitToday } from "@/actions/habits";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DashboardHabit } from "@/types/dashboard";

type HabitsTodayProps = {
  habits: DashboardHabit[];
};

export function HabitsToday({ habits }: HabitsTodayProps) {
  const done = habits.filter((h) => h.completed_today).length;

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Habits</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {habits.length === 0
              ? "Build a daily rhythm"
              : `${done}/${habits.length} done today`}
          </p>
        </div>
        <Link
          href="/habits"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          All
        </Link>
      </div>

      {habits.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          <Link href="/habits" className="font-medium text-foreground hover:underline">
            Add a habit
          </Link>{" "}
          to track here each day.
        </p>
      ) : (
        <ul className="space-y-2">
          {habits.slice(0, 6).map((habit) => (
            <li
              key={habit.id}
              className="flex items-center gap-3 rounded-lg py-1.5"
            >
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
                    "size-8 shrink-0 rounded-full border-2",
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
                    <span className="text-xs font-bold">✓</span>
                  ) : null}
                </Button>
              </form>

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate text-sm font-medium",
                    habit.completed_today && "text-muted-foreground line-through",
                  )}
                >
                  {habit.title}
                </p>
              </div>

              {habit.current_streak > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Flame className="size-3" />
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
