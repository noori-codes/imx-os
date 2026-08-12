import { CheckSquare } from "lucide-react";

import { HabitItem } from "@/components/habits/habit-item";
import type { HabitWithStats } from "@/types/habit";

type HabitListProps = {
  habits: HabitWithStats[];
};

export function HabitList({ habits }: HabitListProps) {
  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center">
        <CheckSquare className="mb-3 size-10 text-muted-foreground" />
        <h3 className="text-lg font-medium">No habits yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Add a daily habit above, then check it off each day to build your
          streak.
        </p>
      </div>
    );
  }

  const doneToday = habits.filter((h) => h.completed_today).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Today: {doneToday}/{habits.length} completed
      </p>
      <ul className="space-y-3">
        {habits.map((habit) => (
          <HabitItem key={habit.id} habit={habit} />
        ))}
      </ul>
    </div>
  );
}
