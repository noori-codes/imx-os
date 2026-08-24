"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import {
  Calendar,
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
import { cn } from "@/lib/utils";
import { formatFocusDuration } from "@/types/focus";
import type { TaskWithContext } from "@/types/task";

type TaskItemProps = {
  task: TaskWithContext;
  todayFocusSeconds?: number;
  onOptimisticToggle: (id: string, completed: boolean) => void;
  onOptimisticDelete: (id: string) => void;
  onOptimisticUpdate: (
    id: string,
    patch: { title: string; due_date: string | null },
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
  const [error, setError] = useState<string | null>(null);

  const overdue = Boolean(
    task.due_date && !task.completed && isOverdue(task.due_date),
  );

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
      onOptimisticUpdate(task.id, { title: nextTitle, due_date: nextDue });
      const result = await updateTask(task.id, {
        title: nextTitle,
        due_date: nextDue,
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
      <li className="border-b border-border/50 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full sm:w-40"
            aria-label="Due date"
          />
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
        {error ? (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        ) : null}
      </li>
    );
  }

  return (
    <li
      className={cn(
        "group flex items-center gap-3 border-b border-border/50 py-2.5 transition-colors",
        task.completed && "opacity-55",
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        onClick={handleToggle}
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        aria-pressed={task.completed}
      >
        {task.completed ? (
          <CheckCircle2 className="size-5 text-foreground" />
        ) : (
          <Circle className="size-5 text-muted-foreground transition-colors group-hover:text-foreground" />
        )}
      </Button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium leading-snug",
            task.completed && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </p>
        {task.context && task.context_href ? (
          <Link
            href={task.context_href}
            className="mt-0.5 block truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            {task.context}
          </Link>
        ) : null}
        {todayFocusSeconds >= 60 ? (
          <Link
            href={`/focus?task=${task.id}`}
            className="mt-0.5 block truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Last focused · {formatFocusDuration(todayFocusSeconds)}
          </Link>
        ) : null}
      </div>

      {task.due_date ? (
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 text-xs",
            overdue ? "font-medium text-destructive" : "text-muted-foreground",
          )}
        >
          <Calendar className="size-3" />
          <span className="max-w-[5.5rem] truncate sm:max-w-none">
            {overdue ? "Overdue" : formatDueLabel(task.due_date)}
          </span>
        </span>
      ) : null}

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
      };

  const [optimisticTasks, dispatch] = useOptimistic(
    tasks,
    (current: TaskWithContext[], action: Action) => {
      switch (action.type) {
        case "toggle":
          return current.map((t) =>
            t.id === action.id ? { ...t, completed: action.completed } : t,
          );
        case "delete":
          return current.filter((t) => t.id !== action.id);
        case "update":
          return current.map((t) =>
            t.id === action.id
              ? { ...t, title: action.title, due_date: action.due_date }
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
      patch: { title: string; due_date: string | null },
    ) => dispatch({ type: "update", id, ...patch }),
  };
}
