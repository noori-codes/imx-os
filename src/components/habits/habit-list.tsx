"use client";

import { useOptimistic } from "react";
import { CheckSquare } from "lucide-react";

import { HabitItem } from "@/components/habits/habit-item";
import type { HabitView, HabitWithStats } from "@/types/habit";

type HabitListProps = {
  habits: HabitWithStats[];
  view?: HabitView;
};

export function HabitList({ habits, view = "active" }: HabitListProps) {
  const [optimisticHabits, removeOptimistic] = useOptimistic(
    habits,
    (current: HabitWithStats[], id: string) =>
      current.filter((h) => h.id !== id),
  );

  if (optimisticHabits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
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
    );
  }

  const doneToday = optimisticHabits.filter((h) => h.completed_today).length;

  return (
    <div>
      {view === "active" ? (
        <p className="mb-3 text-sm text-muted-foreground">
          Today{" "}
          <span className="tabular-nums text-foreground">
            {doneToday}/{optimisticHabits.length}
          </span>
        </p>
      ) : (
        <p className="mb-3 text-sm text-muted-foreground">
          {optimisticHabits.length} archived
        </p>
      )}
      <ul className="border-t border-border/60">
        {optimisticHabits.map((habit) => (
          <HabitItem
            key={habit.id}
            habit={habit}
            archivedView={view === "archived"}
            onOptimisticRemove={removeOptimistic}
          />
        ))}
      </ul>
    </div>
  );
}
