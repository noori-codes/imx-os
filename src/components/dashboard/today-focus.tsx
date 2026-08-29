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
        : null;

  return (
    <li
      className={cn(
        "group flex items-center gap-2.5 rounded-md py-2 transition-colors",
        flash && "dash-task-row-done",
      )}
      style={{ ["--i" as string]: index }}
    >
      <button
        type="button"
        onClick={() => onToggle(task.id, !task.completed)}
        className="flex size-6 shrink-0 items-center justify-center text-muted-foreground/70 transition-colors hover:text-foreground active:scale-95"
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        aria-pressed={task.completed}
      >
        {task.completed ? (
          <CheckCircle2 className="size-4 text-foreground/70" />
        ) : (
          <Circle className="size-4 transition-colors group-hover:text-foreground" />
        )}
      </button>

      <p
        className={cn(
          "min-w-0 flex-1 truncate text-sm text-foreground transition-colors duration-150",
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
    <section className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="dash-quad-label">
          Tasks
        </p>
        <Link
          href="/tasks"
          className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          All
        </Link>
      </div>

      <div
        className={cn("dash-reveal mt-4", celebrateClear && "dash-signal-celebrate")}
      >
        <p
          className={cn(
            "dash-signal-value dash-quad-stat transition-all duration-200",
            tasks.length === 0 || clear
              ? celebrateClear
                ? "text-foreground"
                : "text-muted-foreground"
              : "text-foreground",
          )}
        >
          {tasks.length === 0 ? "—" : clear ? "Clear" : openCount}
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
