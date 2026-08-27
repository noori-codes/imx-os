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
  const overdue = Boolean(
    task.due_date && !task.completed && isOverdue(task.due_date),
  );
  const tag = overdue
    ? "Overdue"
    : task.recurrence === "daily"
      ? "Everyday"
      : task.recurrence === "weekdays"
        ? "Weekdays"
        : null;

  return (
    <li
      className="group flex items-center gap-2.5 py-2"
      style={{ ["--i" as string]: index }}
    >
      <form action={toggleTaskComplete.bind(null, task.id, !task.completed)}>
        <button
          type="submit"
          className="flex size-6 shrink-0 items-center justify-center text-muted-foreground/70 transition-colors hover:text-foreground"
          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        >
          {task.completed ? (
            <CheckCircle2 className="size-4 text-foreground/70" />
          ) : (
            <Circle className="size-4 transition-colors group-hover:text-foreground" />
          )}
        </button>
      </form>

      <p
        className={cn(
          "min-w-0 flex-1 truncate text-sm text-foreground",
          task.completed && "text-muted-foreground/70 line-through",
        )}
      >
        {task.title}
      </p>

      {tag ? (
        <span
          className={cn(
            "shrink-0 text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70",
            overdue && "text-destructive/80",
          )}
        >
          {tag}
        </span>
      ) : null}
    </li>
  );
}

export function TodayFocus({ tasks }: TodayFocusProps) {
  const openCount = tasks.filter((t) => !t.completed).length;
  const clear = tasks.length > 0 && openCount === 0;

  return (
    <section className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Tasks
        </p>
        <Link
          href="/tasks"
          className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          All
        </Link>
      </div>

      <div className="dash-reveal mt-4">
        <p
          className={cn(
            "text-4xl font-medium tracking-tight tabular-nums",
            tasks.length === 0 || clear
              ? "text-muted-foreground"
              : "text-foreground",
          )}
        >
          {tasks.length === 0 ? "—" : openCount}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {tasks.length === 0
            ? "Nothing due"
            : clear
              ? "Clear for today"
              : "open"}
        </p>
      </div>

      {tasks.length === 0 ? (
        <Link
          href="/tasks"
          className="mt-auto pt-6 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Add a task
        </Link>
      ) : (
        <ul className="dash-stagger mt-5 min-h-0 flex-1 border-t border-border/30 pt-1">
          {tasks.map((task, index) => (
            <TaskRow key={task.id} task={task} index={index} />
          ))}
        </ul>
      )}
    </section>
  );
}
