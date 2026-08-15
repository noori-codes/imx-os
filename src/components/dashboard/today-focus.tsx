import Link from "next/link";
import { Calendar, CheckCircle2, Circle, Plus } from "lucide-react";

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
    <li className="group flex items-start gap-3 border-b border-border/50 py-3 last:border-b-0">
      <form action={toggleTaskComplete.bind(null, task.id, !task.completed)}>
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          aria-label="Mark complete"
        >
          {task.completed ? (
            <CheckCircle2 className="size-4 text-foreground" />
          ) : (
            <Circle className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
          )}
        </Button>
      </form>

      <div className="min-w-0 flex-1 pt-1">
        <p className="text-sm font-medium leading-snug">{task.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {task.due_date ? (
            <span
              className={cn(
                "inline-flex items-center gap-1",
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
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function TodayFocus({ tasks }: TodayFocusProps) {
  return (
    <section>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Today</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Your main focus for the day
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href="/tasks">
            <Plus className="size-3.5" />
            Add
          </Link>
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div className="mt-5">
          <p className="text-sm text-muted-foreground">Nothing due today.</p>
          <Link
            href="/tasks"
            className="mt-2 inline-flex text-sm font-medium hover:underline"
          >
            Add a task
          </Link>
        </div>
      ) : (
        <ul className="mt-2">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </ul>
      )}
    </section>
  );
}
