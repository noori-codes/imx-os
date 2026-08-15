import Link from "next/link";
import { Flame, Trophy, Zap } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ActivitySummary, DashboardHabit } from "@/types/dashboard";

type StreaksBoardProps = {
  activity: ActivitySummary;
  habits: DashboardHabit[];
};

function streakMessage(days: number) {
  if (days <= 0) return "Start today — day one counts.";
  if (days === 1) return "You're on the board.";
  if (days < 3) return "Keep the chain going.";
  if (days < 7) return "Nice rhythm — don't break it.";
  if (days < 14) return "A full week energy. Strong.";
  if (days < 30) return "You're in deep streak territory.";
  return "Legendary consistency.";
}

export function StreaksBoard({ activity, habits }: StreaksBoardProps) {
  const ranked = [...habits].sort(
    (a, b) =>
      b.current_streak - a.current_streak ||
      b.longest_streak - a.longest_streak,
  );
  const bestHabit = ranked[0] ?? null;
  const bestHabitCurrent = bestHabit?.current_streak ?? 0;
  const bestHabitLongest = Math.max(
    0,
    ...habits.map((h) => h.longest_streak),
  );
  const liveHabits = ranked.filter((h) => h.current_streak > 0).length;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Streaks</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {streakMessage(
              Math.max(activity.current_streak, bestHabitCurrent),
            )}
          </p>
        </div>
        <Link
          href="/habits"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Manage habits
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent p-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Flame className="size-4" />
            <p className="text-[11px] font-medium uppercase tracking-wider">
              Activity
            </p>
          </div>
          <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums">
            {activity.current_streak}
            <span className="ml-1 text-base font-medium text-muted-foreground">
              days
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {activity.active_days} active days this year
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent p-4">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <Zap className="size-4" />
            <p className="text-[11px] font-medium uppercase tracking-wider">
              Top habit
            </p>
          </div>
          <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums">
            {bestHabitCurrent}
            <span className="ml-1 text-base font-medium text-muted-foreground">
              days
            </span>
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {bestHabit ? bestHabit.title : "No habits yet"}
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent p-4">
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
            <Trophy className="size-4" />
            <p className="text-[11px] font-medium uppercase tracking-wider">
              Personal best
            </p>
          </div>
          <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums">
            {Math.max(bestHabitLongest, activity.current_streak)}
            <span className="ml-1 text-base font-medium text-muted-foreground">
              days
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {liveHabits} habit{liveHabits === 1 ? "" : "s"} on fire
          </p>
        </div>
      </div>

      {habits.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {ranked.slice(0, 6).map((habit) => {
            const hot = habit.current_streak > 0;
            return (
              <li
                key={habit.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5",
                  hot && "border-amber-500/20 bg-amber-500/[0.04]",
                )}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: habit.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{habit.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    best {habit.longest_streak}d
                    {habit.completed_today ? " · done today" : ""}
                  </p>
                </div>
                <div
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-semibold tabular-nums",
                    hot
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Flame
                    className={cn(
                      "size-3.5",
                      hot ? "fill-current" : "opacity-50",
                    )}
                  />
                  {habit.current_streak}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link
            href="/habits"
            className="font-medium text-foreground hover:underline"
          >
            Add a habit
          </Link>{" "}
          and check in daily to light up streaks here.
        </p>
      )}
    </section>
  );
}
