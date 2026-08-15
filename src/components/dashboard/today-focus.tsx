import Link from "next/link";
import { Calendar, CheckCircle2, Circle, Sun } from "lucide-react";

import { toggleTaskComplete } from "@/actions/tasks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isOverdue } from "@/lib/date-utils";
import type { TaskWithContext } from "@/types/dashboard";

type TodayFocusProps = {
  tasks: TaskWithContext[];
};

function TaskRow({ task }: { task: TaskWithContext }) {
  const overdue = task.due_date ? isOverdue(task.due_date) : false;

  return (
    <li className="flex items-start gap-3 rounded-lg border bg-background/60 px-3 py-2.5">
      <form action={toggleTaskComplete.bind(null, task.id, !task.completed)}>
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          aria-label="Mark complete"
        >
          {task.completed ? (
            <CheckCircle2 className="size-4 text-primary" />
          ) : (
            <Circle className="size-4 text-muted-foreground" />
          )}
        </Button>
      </form>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">{task.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {task.due_date ? (
            <span
              className={cn(
                "flex items-center gap-1",
                overdue && "text-destructive",
              )}
            >
              <Calendar className="size-3" />
              {overdue ? "Overdue" : "Due today"}
            </span>
          ) : null}
          {task.context && task.context_href ? (
            <Link
              href={task.context_href}
              className="truncate hover:text-foreground hover:underline"
            >
              {task.context}
            </Link>
          ) : task.project_id === null ? (
            <span>Standalone</span>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function TodayFocus({ tasks }: TodayFocusProps) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm md:p-5">
      <div className="flex items-center gap-2">
        <Sun className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold tracking-tight">Today&apos;s focus</h2>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Due today and overdue tasks
      </p>

      {tasks.length === 0 ? (
        <div className="mt-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing due today — you&apos;re clear!
          </p>
          <Button asChild variant="link" size="sm" className="mt-2">
            <Link href="/tasks">Add a task with a due date</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </ul>
      )}
    </div>
  );
}
