"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import {
  CheckCircle2,
  Circle,
  Pencil,
  Timer,
  Trash2,
  X,
} from "lucide-react";

import { deleteTask, toggleTaskComplete, updateTask } from "@/actions/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isOverdue, isToday } from "@/lib/date-utils";
import {
  nextRecurrenceDueDate,
  recurrenceLabel,
} from "@/lib/task-recurrence";
import { cn } from "@/lib/utils";
import { formatFocusDuration } from "@/types/focus";
import type { TaskRecurrence, TaskWithContext } from "@/types/task";

type TaskItemProps = {
  task: TaskWithContext;
  todayFocusSeconds?: number;
  onOptimisticToggle: (id: string, completed: boolean) => void;
  onOptimisticDelete: (id: string) => void;
  onOptimisticUpdate: (
    id: string,
    patch: {
      title: string;
      due_date: string | null;
      recurrence?: TaskRecurrence;
    },
  ) => void;
};

function formatDueLabel(dueDate: string) {
  if (isToday(dueDate)) return "Today";
  if (isOverdue(dueDate)) {
    return new Date(`${dueDate}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
  return new Date(`${dueDate}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function TaskItem({
  task,
  todayFocusSeconds = 0,
  onOptimisticToggle,
  onOptimisticDelete,
  onOptimisticUpdate,
}: TaskItemProps) {
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [recurrence, setRecurrence] = useState<TaskRecurrence>(
    task.recurrence ?? null,
  );
  const [error, setError] = useState<string | null>(null);

  const overdue = Boolean(
    task.due_date && !task.completed && isOverdue(task.due_date),
  );
  const repeatLabel = recurrenceLabel(task.recurrence);

  function handleToggle() {
    const next = !task.completed;
    startTransition(async () => {
      onOptimisticToggle(task.id, next);
      await toggleTaskComplete(task.id, next);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      onOptimisticDelete(task.id);
      await deleteTask(task.id);
    });
  }

  function startEdit() {
    setTitle(task.title);
    setDueDate(task.due_date ?? "");
    setRecurrence(task.recurrence ?? null);
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setError(null);
  }

  function saveEdit() {
    const nextTitle = title.trim();
    if (!nextTitle) {
      setError("Title is required.");
      return;
    }
    const nextDue = dueDate.length ? dueDate : null;
    startTransition(async () => {
      onOptimisticUpdate(task.id, {
        title: nextTitle,
        due_date: nextDue,
        recurrence,
      });
      const result = await updateTask(task.id, {
        title: nextTitle,
        due_date: nextDue,
        recurrence,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
      setError(null);
    });
  }

  if (editing) {
    return (
      <li className="border-b border-border/30 py-3">
        <div className="flex flex-col gap-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                saveEdit();
              }
              if (e.key === "Escape") cancelEdit();
            }}
            className="flex-1"
            autoFocus
            aria-label="Task title"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full sm:w-40"
              aria-label="Due date"
            />
            <select
              value={recurrence ?? ""}
              onChange={(e) =>
                setRecurrence(
                  e.target.value === "daily" || e.target.value === "weekdays"
                    ? e.target.value
                    : null,
                )
              }
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm sm:w-40"
              aria-label="Repeat"
            >
              <option value="">Doesn’t repeat</option>
              <option value="daily">Everyday</option>
              <option value="weekdays">Weekdays</option>
            </select>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={saveEdit}>
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={cancelEdit}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        </div>
        {error ? (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        ) : null}
      </li>
    );
  }

  const metaParts: string[] = [];
  if (repeatLabel) metaParts.push(repeatLabel);
  if (task.due_date && !repeatLabel) {
    metaParts.push(overdue ? "Overdue" : formatDueLabel(task.due_date));
  } else if (task.due_date && overdue) {
    metaParts.push("Overdue");
  } else if (task.due_date && repeatLabel && !isToday(task.due_date) && !overdue) {
    metaParts.push(formatDueLabel(task.due_date));
  }

  return (
    <li
      className={cn(
        "group flex items-center gap-3 border-b border-border/30 py-3 last:border-b-0",
        task.completed && "opacity-55",
      )}
    >
      <button
        type="button"
        className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground"
        onClick={handleToggle}
        aria-label={
          task.recurrence && !task.completed
            ? "Mark done for today"
            : task.completed
              ? "Mark incomplete"
              : "Mark complete"
        }
        aria-pressed={task.completed}
      >
        {task.completed ? (
          <CheckCircle2 className="size-4 text-foreground" />
        ) : (
          <Circle className="size-4 transition-colors group-hover:text-foreground" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm text-foreground",
            task.completed && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
          {metaParts.map((part) => (
            <span
              key={part}
              className={cn(
                part === "Overdue" && "text-destructive/80",
                part === "Everyday" || part === "Weekdays"
                  ? "text-foreground/55"
                  : null,
              )}
            >
              {part}
            </span>
          ))}
          {task.context && task.context_href ? (
            <Link
              href={task.context_href}
              className="truncate transition-colors hover:text-foreground"
            >
              {task.context}
            </Link>
          ) : null}
          {todayFocusSeconds >= 60 ? (
            <Link
              href={`/focus?task=${task.id}`}
              className="truncate transition-colors hover:text-foreground"
            >
              {formatFocusDuration(todayFocusSeconds)} focused
            </Link>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        {!task.completed ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            asChild
          >
            <Link href={`/focus?task=${task.id}`} aria-label="Focus on this task">
              <Timer className="size-3.5" />
            </Link>
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
          onClick={startEdit}
          aria-label="Edit task"
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
          aria-label="Delete task"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </li>
  );
}

/** Lightweight optimistic list shell used by TaskList */
export function useTaskOptimistic(tasks: TaskWithContext[]) {
  type Action =
    | { type: "toggle"; id: string; completed: boolean }
    | { type: "delete"; id: string }
    | {
        type: "update";
        id: string;
        title: string;
        due_date: string | null;
        recurrence?: TaskRecurrence;
      };

  const [optimisticTasks, dispatch] = useOptimistic(
    tasks,
    (current: TaskWithContext[], action: Action) => {
      switch (action.type) {
        case "toggle":
          return current.map((t) => {
            if (t.id !== action.id) return t;
            if (t.recurrence && action.completed) {
              return {
                ...t,
                completed: false,
                due_date: nextRecurrenceDueDate(t.recurrence),
              };
            }
            return { ...t, completed: action.completed };
          });
        case "delete":
          return current.filter((t) => t.id !== action.id);
        case "update":
          return current.map((t) =>
            t.id === action.id
              ? {
                  ...t,
                  title: action.title,
                  due_date: action.due_date,
                  recurrence:
                    action.recurrence !== undefined
                      ? action.recurrence
                      : t.recurrence,
                }
              : t,
          );
        default:
          return current;
      }
    },
  );

  return {
    optimisticTasks,
    onOptimisticToggle: (id: string, completed: boolean) =>
      dispatch({ type: "toggle", id, completed }),
    onOptimisticDelete: (id: string) => dispatch({ type: "delete", id }),
    onOptimisticUpdate: (
      id: string,
      patch: {
        title: string;
        due_date: string | null;
        recurrence?: TaskRecurrence;
      },
    ) => dispatch({ type: "update", id, ...patch }),
  };
}
