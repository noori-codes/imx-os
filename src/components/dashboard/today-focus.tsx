import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

import { toggleTaskComplete } from "@/actions/tasks";
import { cn } from "@/lib/utils";
import { isOverdue } from "@/lib/date-utils";
import type { TaskWithContext } from "@/types/dashboard";

type TodayFocusProps = {
  tasks: TaskWithContext[];
};

function TaskRow({
  task,
  index,
}: {
  task: TaskWithContext;
  index: number;
}) {
  const overdue = Boolean(task.due_date && isOverdue(task.due_date));
  const repeat =
    task.recurrence === "daily"
      ? "Everyday"
      : task.recurrence === "weekdays"
        ? "Weekdays"
        : null;
  const meta = overdue
    ? "Overdue"
    : repeat
      ? repeat
      : task.context
        ? task.context
        : null;

  return (
    <li
      className="group flex items-center gap-3 border-b border-border/30 py-3 last:border-b-0"
      style={{ ["--i" as string]: index }}
    >
      <form action={toggleTaskComplete.bind(null, task.id, !task.completed)}>
        <button
          type="submit"
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground"
          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        >
          {task.completed ? (
            <CheckCircle2 className="size-4 text-foreground" />
          ) : (
            <Circle className="size-4 transition-colors group-hover:text-foreground" />
          )}
        </button>
      </form>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm text-foreground",
            task.completed && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </p>
        {meta ? (
          <p
            className={cn(
              "mt-0.5 truncate text-[11px] text-muted-foreground",
              overdue && "text-destructive/80",
            )}
          >
            {task.context_href && !overdue ? (
              <Link
                href={task.context_href}
                className="transition-colors hover:text-foreground"
              >
                {meta}
              </Link>
            ) : (
              meta
            )}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function GhostTasks() {
  return (
    <div className="flex flex-1 flex-col">
      <ul className="pointer-events-none border-t border-border/30" aria-hidden="true">
        {[68, 54, 40].map((width, i) => (
          <li
            key={i}
            className="flex items-center gap-3 border-b border-border/20 py-3 last:border-b-0"
            style={{ opacity: 0.42 - i * 0.1 }}
          >
            <span className="size-4 shrink-0 rounded-full border border-border/50" />
            <span
              className="h-2.5 rounded-full bg-muted"
              style={{ width: `${width}%` }}
            />
          </li>
        ))}
      </ul>
      <Link
        href="/tasks"
        className="mt-auto pt-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Add a task
      </Link>
    </div>
  );
}

export function TodayFocus({ tasks }: TodayFocusProps) {
  return (
    <section className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Tasks
          </p>
          {tasks.length > 0 ? (
            <span className="text-[11px] tabular-nums text-muted-foreground/70">
              {tasks.length}
            </span>
          ) : null}
        </div>
        <Link
          href="/tasks"
          className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          All
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="mt-3 flex min-h-0 flex-1 flex-col">
          <GhostTasks />
        </div>
      ) : (
        <ul className="dash-stagger mt-3 min-h-0 flex-1 border-t border-border/30">
          {tasks.map((task, index) => (
            <TaskRow key={task.id} task={task} index={index} />
          ))}
        </ul>
      )}
    </section>
  );
}
