import { Calendar, CheckCircle2, Circle, Trash2 } from "lucide-react";

import { deleteTask, toggleTaskComplete } from "@/actions/tasks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/task";

type TaskItemProps = {
  task: Task;
};

function formatDueDate(dueDate: string) {
  return new Date(`${dueDate}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isOverdue(task: Task) {
  if (!task.due_date || task.completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${task.due_date}T00:00:00`);
  return due < today;
}

export function TaskItem({ task }: TaskItemProps) {
  const overdue = isOverdue(task);

  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-lg border bg-card px-4 py-3 shadow-sm transition-colors",
        task.completed && "opacity-60",
      )}
    >
      <form action={toggleTaskComplete.bind(null, task.id, !task.completed)}>
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="mt-0.5 size-8 shrink-0"
          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        >
          {task.completed ? (
            <CheckCircle2 className="size-5 text-primary" />
          ) : (
            <Circle className="size-5 text-muted-foreground" />
          )}
        </Button>
      </form>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium leading-snug",
            task.completed && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </p>

        {task.due_date ? (
          <p
            className={cn(
              "mt-1 flex items-center gap-1 text-xs",
              overdue ? "text-destructive" : "text-muted-foreground",
            )}
          >
            <Calendar className="size-3 shrink-0" />
            {overdue ? "Overdue · " : "Due "}
            {formatDueDate(task.due_date)}
          </p>
        ) : null}
      </div>

      <form action={deleteTask.bind(null, task.id)}>
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
          aria-label="Delete task"
        >
          <Trash2 className="size-4" />
        </Button>
      </form>
    </li>
  );
}
