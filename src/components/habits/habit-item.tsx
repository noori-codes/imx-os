"use client";

import { useOptimistic, useTransition } from "react";
import { Flame, Loader2, Trash2 } from "lucide-react";

import { deleteHabit, toggleHabitToday } from "@/actions/habits";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toDateString } from "@/lib/date-utils";
import type { HabitWithStats } from "@/types/habit";

type HabitItemProps = {
  habit: HabitWithStats;
};

export function HabitItem({ habit }: HabitItemProps) {
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    habit,
    (state, completed: boolean) => {
      const today = toDateString(new Date());
      let current_streak = state.current_streak;

      if (!state.completed_today && completed) current_streak += 1;
      if (state.completed_today && !completed) {
        current_streak = Math.max(0, current_streak - 1);
      }

      return {
        ...state,
        completed_today: completed,
        current_streak,
        longest_streak: Math.max(state.longest_streak, current_streak),
        week: state.week.map((day) =>
          day.date === today ? { ...day, completed } : day,
        ),
      };
    },
  );

  function onToggle() {
    const next = !optimistic.completed_today;
    startTransition(async () => {
      setOptimistic(next);
      await toggleHabitToday(optimistic.id, next);
    });
  }

  return (
    <li className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onToggle}
          disabled={isPending}
          className={cn(
            "mt-0.5 size-10 shrink-0 rounded-full border-2 transition-all duration-150",
            optimistic.completed_today && "text-white",
            isPending && "opacity-80",
          )}
          style={
            optimistic.completed_today
              ? {
                  backgroundColor: optimistic.color,
                  borderColor: optimistic.color,
                }
              : { borderColor: optimistic.color }
          }
          aria-label={
            optimistic.completed_today
              ? "Undo today's check-in"
              : "Mark done for today"
          }
          aria-pressed={optimistic.completed_today}
        >
          {isPending && !optimistic.completed_today ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : optimistic.completed_today ? (
            <span className="text-sm font-bold">✓</span>
          ) : null}
        </Button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3
                className={cn(
                  "font-semibold leading-snug transition-colors",
                  optimistic.completed_today && "text-muted-foreground",
                )}
              >
                {optimistic.title}
              </h3>
              {optimistic.description ? (
                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                  {optimistic.description}
                </p>
              ) : null}
            </div>

            <form action={deleteHabit.bind(null, optimistic.id)}>
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
                  "size-3.5 transition-colors",
                  optimistic.current_streak > 0
                    ? "fill-amber-500 text-amber-500"
                    : "text-muted-foreground",
                )}
              />
              {optimistic.current_streak} day streak
            </span>
            <span>Best: {optimistic.longest_streak}</span>
            <span>
              {optimistic.completed_today ? "Done today" : "Not done yet"}
            </span>
          </div>

          <div className="mt-3 flex gap-1.5">
            {optimistic.week.map((day) => (
              <div
                key={day.date}
                title={day.date}
                className={cn(
                  "h-2.5 flex-1 rounded-sm transition-colors duration-150",
                  day.completed ? "opacity-100" : "bg-muted opacity-60",
                )}
                style={
                  day.completed
                    ? { backgroundColor: optimistic.color }
                    : undefined
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
