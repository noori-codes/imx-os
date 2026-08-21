"use client";

import { useOptimistic } from "react";
import { CheckSquare } from "lucide-react";

import { HabitItem } from "@/components/habits/habit-item";
import { EmptyState } from "@/components/shared/empty-state";
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
      <EmptyState
        icon={CheckSquare}
        title={view === "archived" ? "No archived habits" : "No habits yet"}
        description={
          view === "archived"
            ? "Archived habits will show up here."
            : "Add a daily habit above, then check it off to build a streak."
        }
      />
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
