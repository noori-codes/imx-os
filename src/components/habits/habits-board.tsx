"use client";

import { useOptimistic } from "react";
import { CheckSquare } from "lucide-react";

import { HabitForm } from "@/components/habits/habit-form";
import { HabitItem } from "@/components/habits/habit-item";
import { HabitViewTabs } from "@/components/habits/habit-view-tabs";
import { toDateString } from "@/lib/date-utils";
import type { HabitView, HabitWithStats } from "@/types/habit";

type HabitsBoardProps = {
  habits: HabitWithStats[];
  view: HabitView;
  activeCount: number;
  archivedCount: number;
};

type BoardAction =
  | { type: "remove"; id: string }
  | { type: "toggle"; id: string; completed: boolean };

function reduceHabits(
  current: HabitWithStats[],
  action: BoardAction,
): HabitWithStats[] {
  if (action.type === "remove") {
    return current.filter((habit) => habit.id !== action.id);
  }

  const today = toDateString(new Date());
  return current.map((habit) => {
    if (habit.id !== action.id) return habit;

    let current_streak = habit.current_streak;
    if (!habit.completed_today && action.completed) current_streak += 1;
    if (habit.completed_today && !action.completed) {
      current_streak = Math.max(0, current_streak - 1);
    }

    return {
      ...habit,
      completed_today: action.completed,
      current_streak,
      longest_streak: Math.max(habit.longest_streak, current_streak),
      week: habit.week.map((day) =>
        day.date === today
          ? { ...day, completed: action.completed }
          : day,
      ),
    };
  });
}

function PulseRing({
  progress,
  size = 112,
  stroke = 7,
}: {
  progress: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference * (1 - Math.min(100, Math.max(0, progress)) / 100);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-muted/70"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="text-foreground transition-[stroke-dashoffset] duration-700 ease-out"
      />
    </svg>
  );
}

function TodayPulse({ habits }: { habits: HabitWithStats[] }) {
  const done = habits.filter((h) => h.completed_today).length;
  const total = habits.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const clear = total > 0 && done === total;
  const remaining = Math.max(0, total - done);
  const topStreak = habits.reduce(
    (best, habit) => Math.max(best, habit.current_streak),
    0,
  );

  return (
    <section className="habits-pulse relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 px-5 py-5 sm:px-7 sm:py-6">
      <div className="habits-pulse-glow" aria-hidden />
      <div className="relative z-1 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Today&apos;s pulse
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {total === 0
              ? "No rituals yet"
              : clear
                ? "Day sealed"
                : remaining === 1
                  ? "One left"
                  : `${remaining} still open`}
          </h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {total === 0
              ? "Add a daily habit below and check it off to light the week."
              : clear
                ? "Every active habit is checked in. Keep the streak warm."
                : `Tap a habit to check in · longest live streak ${topStreak}d`}
          </p>
        </div>

        <div className="relative mx-auto flex size-28 items-center justify-center sm:mx-0">
          <PulseRing progress={progress} />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
              {total === 0 ? "—" : `${done}/${total}`}
            </p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {clear ? "sealed" : "today"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HabitsBoard({
  habits,
  view,
  activeCount,
  archivedCount,
}: HabitsBoardProps) {
  const [optimisticHabits, dispatchOptimistic] = useOptimistic(
    habits,
    reduceHabits,
  );

  const ordered =
    view === "active"
      ? [...optimisticHabits].sort((a, b) => {
          if (a.completed_today === b.completed_today) return 0;
          return a.completed_today ? 1 : -1;
        })
      : optimisticHabits;

  return (
    <div className="flex flex-col gap-6">
      {view === "active" ? <TodayPulse habits={optimisticHabits} /> : null}

      <HabitViewTabs
        active={view}
        activeCount={activeCount}
        archivedCount={archivedCount}
      />

      {view === "active" ? (
        <div className="habits-composer rounded-2xl border border-border/50 bg-card/80 p-4 sm:p-5">
          <div className="mb-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              New ritual
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Something small you can seal every day.
            </p>
          </div>
          <HabitForm variant="composer" />
        </div>
      ) : null}

      {ordered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 px-6 py-16 text-center">
          <CheckSquare className="mb-3 size-8 text-muted-foreground" />
          <h3 className="text-base font-medium">
            {view === "archived" ? "No archived habits" : "No habits yet"}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {view === "archived"
              ? "Archived habits will show up here."
              : "Add a daily habit above, then check it off to build a streak."}
          </p>
        </div>
      ) : (
        <ul className="habits-grid grid gap-3 sm:grid-cols-2">
          {ordered.map((habit, index) => (
            <HabitItem
              key={habit.id}
              habit={habit}
              index={index}
              archivedView={view === "archived"}
              onOptimisticRemove={(id) =>
                dispatchOptimistic({ type: "remove", id })
              }
              onOptimisticToggle={(id, completed) =>
                dispatchOptimistic({ type: "toggle", id, completed })
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}
