import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

import { toggleTaskComplete } from "@/actions/tasks";
import { cn } from "@/lib/utils";
import { isOverdue } from "@/lib/date-utils";
import type { TaskWithContext } from "@/types/dashboard";

type TodayFocusProps = {
  tasks: TaskWithContext[];
};

function TaskRow({ task }: { task: TaskWithContext }) {
  const overdue = task.due_date ? isOverdue(task.due_date) : false;

  return (
    <li className="group flex items-start gap-3 border-b border-border/40 py-3.5 last:border-b-0">
      <form action={toggleTaskComplete.bind(null, task.id, !task.completed)}>
        <button
          type="submit"
          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        >
          {task.completed ? (
            <CheckCircle2 className="size-4 text-foreground" />
          ) : (
            <Circle className="size-4 transition-colors group-hover:text-foreground" />
          )}
        </button>
      </form>

      <div className="min-w-0 flex-1 pt-1">
        <p
          className={cn(
            "text-sm leading-snug text-foreground",
            task.completed && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {task.due_date ? (
            <span
              className={cn("tabular-nums", overdue && "text-destructive")}
            >
              {overdue ? "Overdue" : "Due today"}
            </span>
          ) : null}
          {task.context && task.context_href ? (
            <Link
              href={task.context_href}
              className="truncate transition-colors hover:text-foreground"
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
    <section className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Tasks
          {tasks.length > 0 ? (
            <span className="ml-2 tabular-nums text-muted-foreground/80">
              {tasks.length}
            </span>
          ) : null}
        </p>
        <Link
          href="/tasks"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          All
        </Link>
      </div>

      {tasks.length === 0 ? (
        <Link
          href="/tasks"
          className="mt-5 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Add a task
        </Link>
      ) : (
        <ul className="mt-4">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </ul>
      )}
    </section>
  );
}
