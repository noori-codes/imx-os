import Link from "next/link";
import { FolderKanban, Target, Trash2 } from "lucide-react";

import { deleteGoal } from "@/actions/goals";
import { Button } from "@/components/ui/button";
import type { GoalWithCounts } from "@/types/goal";

type GoalListProps = {
  goals: GoalWithCounts[];
};

export function GoalList({ goals }: GoalListProps) {
  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center">
        <Target className="mb-3 size-10 text-muted-foreground" />
        <h3 className="text-lg font-medium">No goals yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Goals are big outcomes. Break each one into projects, then tasks.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {goals.map((goal) => (
        <li
          key={goal.id}
          className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm"
        >
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Target className="size-4 text-primary" />
          </div>

          <div className="min-w-0 flex-1">
            <Link
              href={`/goals/${goal.id}`}
              className="text-base font-semibold hover:underline"
            >
              {goal.title}
            </Link>

            {goal.description ? (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {goal.description}
              </p>
            ) : null}

            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <FolderKanban className="size-3" />
                {goal.project_count}{" "}
                {goal.project_count === 1 ? "project" : "projects"}
              </span>
              <span>
                {goal.task_count}{" "}
                {goal.task_count === 1 ? "task" : "tasks"}
              </span>
            </div>
          </div>

          <form action={deleteGoal.bind(null, goal.id)}>
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
              aria-label="Delete goal"
            >
              <Trash2 className="size-4" />
            </Button>
          </form>
        </li>
      ))}
    </ul>
  );
}
