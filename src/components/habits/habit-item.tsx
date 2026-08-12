import { Flame, Trash2 } from "lucide-react";

import { deleteHabit, toggleHabitToday } from "@/actions/habits";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HabitWithStats } from "@/types/habit";

type HabitItemProps = {
  habit: HabitWithStats;
};

export function HabitItem({ habit }: HabitItemProps) {
  return (
    <li className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
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
              "mt-0.5 size-10 shrink-0 rounded-full border-2",
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
                ? "Undo today's check-in"
                : "Mark done for today"
            }
          >
            {habit.completed_today ? (
              <span className="text-sm font-bold">✓</span>
            ) : null}
          </Button>
        </form>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold leading-snug">{habit.title}</h3>
              {habit.description ? (
                <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                  {habit.description}
                </p>
              ) : null}
            </div>

            <form action={deleteHabit.bind(null, habit.id)}>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                aria-label="Delete habit"
              >
                <Trash2 className="size-4" />
              </Button>
            </form>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <Flame
                className={cn(
                  "size-3.5",
                  habit.current_streak > 0
                    ? "text-amber-500"
                    : "text-muted-foreground",
                )}
              />
              {habit.current_streak} day streak
            </span>
            <span>Best: {habit.longest_streak}</span>
            <span>
              {habit.completed_today ? "Done today" : "Not done yet"}
            </span>
          </div>

          <div className="mt-3 flex gap-1.5">
            {habit.week.map((day) => (
              <div
                key={day.date}
                title={day.date}
                className={cn(
                  "h-2.5 flex-1 rounded-sm",
                  day.completed ? "opacity-100" : "bg-muted opacity-60",
                )}
                style={
                  day.completed ? { backgroundColor: habit.color } : undefined
                }
              />
            ))}
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            Last 7 days
          </p>
        </div>
      </div>
    </li>
  );
}
