"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";

import { cn } from "@/lib/utils";
import { isOverdue } from "@/lib/date-utils";
import type { TaskWithContext } from "@/types/dashboard";

type TodayFocusProps = {
  tasks: TaskWithContext[];
  onToggle: (taskId: string, completed: boolean) => void;
};

function TaskRow({
  task,
  index,
  flash,
  onToggle,
}: {
  task: TaskWithContext;
  index: number;
  flash: boolean;
  onToggle: (taskId: string, completed: boolean) => void;
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
        : task.context
          ? task.context
          : null;

  return (
    <li
      className={cn(
        "group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/40",
        flash && "dash-task-row-done",
      )}
      style={{ ["--i" as string]: index }}
    >
      <button
        type="button"
        onClick={() => onToggle(task.id, !task.completed)}
        className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground active:scale-95"
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        aria-pressed={task.completed}
      >
        {task.completed ? (
          <CheckCircle2 className="size-5 text-foreground/75" />
        ) : (
          <Circle className="size-5 transition-colors group-hover:text-foreground" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium text-foreground transition-colors duration-150",
            task.completed && "text-muted-foreground/70 line-through",
          )}
        >
          {task.title}
        </p>
        {tag ? (
          <p
            className={cn(
              "mt-0.5 truncate text-[11px] text-muted-foreground",
              overdue && "text-destructive/80",
            )}
          >
            {tag}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export function TodayFocus({ tasks, onToggle }: TodayFocusProps) {
  const openCount = tasks.filter((t) => !t.completed).length;
  const clear = tasks.length > 0 && openCount === 0;
  const [flashTaskId, setFlashTaskId] = useState<string | null>(null);
  const [celebrateClear, setCelebrateClear] = useState(false);
  const prevClear = useRef(clear);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      prevClear.current = clear;
      return;
    }
    if (clear && !prevClear.current) {
      setCelebrateClear(true);
      const timer = window.setTimeout(() => setCelebrateClear(false), 720);
      prevClear.current = clear;
      return () => window.clearTimeout(timer);
    }
    prevClear.current = clear;
  }, [clear]);

  function handleToggle(taskId: string, completed: boolean) {
    if (completed) {
      setFlashTaskId(taskId);
      window.setTimeout(() => setFlashTaskId(null), 500);
    }
    onToggle(taskId, completed);
  }

  return (
    <section
      className={cn(
        "dash-panel flex h-full min-h-0 flex-col",
        celebrateClear && "dash-signal-celebrate",
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/40 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Today</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {tasks.length === 0
              ? "Nothing due"
              : clear
                ? "All clear"
                : `${openCount} open`}
          </p>
        </div>
        <Link
          href="/tasks"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-1 flex-col items-start justify-center px-5 py-8">
          <p className="text-sm text-muted-foreground">
            No tasks lined up for today.
          </p>
          <Link
            href="/tasks"
            className="mt-3 text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            Add a task
          </Link>
        </div>
      ) : (
        <ul className="dash-stagger min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          {tasks.map((task, index) => (
            <TaskRow
              key={task.id}
              task={task}
              index={index}
              flash={flashTaskId === task.id}
              onToggle={handleToggle}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
