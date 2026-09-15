"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { CheckCircle2, Circle, ListTodo, Timer } from "lucide-react";

import { updateTask } from "@/actions/tasks";
import { EmptyState } from "@/components/shared/empty-state";
import {
  addDays,
  isOverdue,
  parseDateString,
  startOfDay,
  toDateString,
} from "@/lib/date-utils";
import { imxToast } from "@/lib/imx-toast";
import { cn } from "@/lib/utils";
import type { TaskWithContext } from "@/types/dashboard";

type TodayFocusProps = {
  tasks: TaskWithContext[];
  onToggle: (taskId: string, completed: boolean) => void;
  onSchedule?: (taskId: string, dueDate: string | null) => void;
};

function TaskRow({
  task,
  index,
  flash,
  onToggle,
  onSchedule,
}: {
  task: TaskWithContext;
  index: number;
  flash: boolean;
  onToggle: (taskId: string, completed: boolean) => void;
  onSchedule?: (taskId: string, dueDate: string | null) => void;
}) {
  const [, startTransition] = useTransition();
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

  const today = toDateString(startOfDay(new Date()));
  const tomorrow = toDateString(addDays(startOfDay(new Date()), 1));
  const deferBase = task.due_date
    ? parseDateString(task.due_date)
    : startOfDay(new Date());
  const plusOne = toDateString(addDays(deferBase, 1));
  const nextWeek = toDateString(addDays(deferBase, 7));

  function schedule(nextDue: string | null) {
    startTransition(async () => {
      onSchedule?.(task.id, nextDue);
      const result = await updateTask(task.id, {
        title: task.title,
        due_date: nextDue,
        recurrence: task.recurrence,
      });
      if (result.error) {
        imxToast("Couldn’t update due date", {
          description: result.error,
          tone: "error",
        });
        return;
      }
      imxToast(
        nextDue === null
          ? "Cleared due date"
          : nextDue === today
            ? "Due today"
            : nextDue === tomorrow
              ? "Due tomorrow"
              : "Due date updated",
        { tone: "success" },
      );
    });
  }

  return (
    <li
      className={cn(
        "group flex flex-col gap-1.5 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/40",
        flash && "dash-task-row-done",
      )}
      style={{ ["--i" as string]: index }}
    >
      <div className="flex items-center gap-3">
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

        {!task.completed ? (
          <Link
            href={`/focus?task=${task.id}`}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-100 transition-colors hover:bg-muted hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
            aria-label="Focus on this task"
          >
            <Timer className="size-3.5" />
          </Link>
        ) : null}
      </div>

      {!task.completed ? (
        <div className="flex flex-wrap items-center gap-1 pl-10">
          {(
            [
              { label: "Today", value: today },
              { label: "Tmrw", value: tomorrow },
              { label: "+1d", value: plusOne },
              { label: "+1w", value: nextWeek },
            ] as const
          ).map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => schedule(chip.value)}
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                task.due_date === chip.value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {chip.label}
            </button>
          ))}
          {task.due_date ? (
            <button
              type="button"
              onClick={() => schedule(null)}
              className="rounded-md px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Clear
            </button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function TodayFocus({ tasks, onToggle, onSchedule }: TodayFocusProps) {
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
        "dash-panel relative flex h-full min-h-0 flex-col overflow-hidden",
        celebrateClear && "dash-signal-celebrate",
      )}
    >
      <div className="dash-panel-glow" aria-hidden="true" />
      <div className="relative z-[1] flex items-center justify-between gap-3 border-b border-border/40 px-5 py-4">
        <div>
          <p className="dash-panel-eyebrow">On deck</p>
          <h3 className="mt-0.5 text-sm font-semibold text-foreground">Today</h3>
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
        <div className="relative z-[1] flex flex-1 flex-col justify-center px-3 py-4">
          <EmptyState
            icon={ListTodo}
            title="Nothing due today"
            description="Capture something for the day — or leave the deck clear."
            variant="plain"
            className="py-6"
          >
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/tasks?compose=1"
                className="inline-flex h-8 items-center rounded-lg bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90"
              >
                Add a task
              </Link>
              <Link
                href="/calendar?compose=1"
                className="inline-flex h-8 items-center rounded-lg border border-border/60 bg-card/70 px-3 text-xs font-medium text-foreground transition-colors hover:border-border"
              >
                Add event
              </Link>
            </div>
          </EmptyState>
        </div>
      ) : (
        <ul className="dash-stagger relative z-[1] min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          {tasks.map((task, index) => (
            <TaskRow
              key={task.id}
              task={task}
              index={index}
              flash={flashTaskId === task.id}
              onToggle={handleToggle}
              onSchedule={onSchedule}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
