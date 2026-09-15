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
import { BrandSelect } from "@/components/ui/brand-select";
import { Button } from "@/components/ui/button";
import { confirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { addDays, isOverdue, isToday, parseDateString, startOfDay, toDateString } from "@/lib/date-utils";
import { imxToast } from "@/lib/imx-toast";
import { recurrenceLabel } from "@/lib/task-recurrence";
import { cn } from "@/lib/utils";
import { formatFocusDuration } from "@/types/focus";
import type {
  TaskProjectOption,
  TaskRecurrence,
  TaskView,
  TaskWithContext,
} from "@/types/task";

type TaskUpdatePatch = {
  title: string;
  due_date: string | null;
  recurrence?: TaskRecurrence;
  project_id?: string | null;
  context?: string | null;
  context_href?: string | null;
};

type TaskItemProps = {
  task: TaskWithContext;
  view?: TaskView;
  index?: number;
  todayFocusSeconds?: number;
  projects?: TaskProjectOption[];
  onOptimisticToggle: (id: string, completed: boolean) => void;
  onOptimisticDelete: (id: string) => void;
  onOptimisticUpdate: (id: string, patch: TaskUpdatePatch) => void;
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

function buildMeta(
  task: TaskWithContext,
  view: TaskView | undefined,
  todayFocusSeconds: number,
): { text: string; href?: string; alert?: boolean }[] {
  const parts: { text: string; href?: string; alert?: boolean }[] = [];
  const repeat = recurrenceLabel(task.recurrence);
  const overdue = Boolean(
    task.due_date && !task.completed && isOverdue(task.due_date),
  );

  if (repeat) parts.push({ text: repeat });

  if (overdue) {
    parts.push({ text: "Overdue", alert: true });
  } else if (task.due_date && !repeat) {
    const label = formatDueLabel(task.due_date);
    if (!(view === "today" && label === "Today")) {
      parts.push({ text: label });
    }
  } else if (
    task.due_date &&
    repeat &&
    !isToday(task.due_date) &&
    !overdue
  ) {
    parts.push({ text: formatDueLabel(task.due_date) });
  }

  if (task.context && task.context_href) {
    parts.push({ text: task.context, href: task.context_href });
  }

  if (todayFocusSeconds >= 60) {
    parts.push({
      text: `${formatFocusDuration(todayFocusSeconds)} focused`,
      href: `/focus?task=${task.id}`,
    });
  }

  return parts.slice(0, 3);
}

export function TaskItem({
  task,
  view,
  index = 0,
  todayFocusSeconds = 0,
  projects = [],
  onOptimisticToggle,
  onOptimisticDelete,
  onOptimisticUpdate,
}: TaskItemProps) {
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [projectId, setProjectId] = useState(task.project_id ?? "");
  const [recurrence, setRecurrence] = useState<TaskRecurrence>(
    task.recurrence ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");

  const meta = buildMeta(task, view, todayFocusSeconds);

  function handleToggle() {
    const next = !task.completed;
    if (next) {
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), 480);
      setLiveMessage("Task completed");
    } else {
      setLiveMessage("Task reopened");
    }
    startTransition(async () => {
      onOptimisticToggle(task.id, next);
      const result = await toggleTaskComplete(task.id, next);
      if (result.error) {
        onOptimisticToggle(task.id, !next);
        setLiveMessage("Couldn’t update task");
        imxToast("Couldn’t update task", {
          description: result.error,
          tone: "error",
        });
      }
    });
  }

  function handleDelete() {
    void (async () => {
      const ok = await confirm({
        title: `Delete “${task.title}”?`,
        description: "This removes the task from your list.",
        confirmLabel: "Delete",
        destructive: true,
      });
      if (!ok) return;
      startTransition(async () => {
        onOptimisticDelete(task.id);
        await deleteTask(task.id);
        imxToast("Task deleted", { tone: "success" });
      });
    })();
  }

  function scheduleDue(nextDue: string | null) {
    const label =
      nextDue === null
        ? "Cleared due date"
        : nextDue === toDateString(startOfDay(new Date()))
          ? "Due today"
          : nextDue === toDateString(addDays(startOfDay(new Date()), 1))
            ? "Due tomorrow"
            : "Due date updated";
    startTransition(async () => {
      onOptimisticUpdate(task.id, {
        title: task.title,
        due_date: nextDue,
        recurrence: task.recurrence,
      });
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
      imxToast(label, { tone: "success" });
    });
  }

  function startEdit() {
    setTitle(task.title);
    setDueDate(task.due_date ?? "");
    setProjectId(task.project_id ?? "");
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
    const nextProjectId = projectId.length ? projectId : null;
    const projectLabel =
      projects.find((project) => project.id === nextProjectId)?.label ?? null;
    startTransition(async () => {
      onOptimisticUpdate(task.id, {
        title: nextTitle,
        due_date: nextDue,
        recurrence,
        project_id: nextProjectId,
        context: projectLabel,
        context_href: null,
      });
      const result = await updateTask(task.id, {
        title: nextTitle,
        due_date: nextDue,
        recurrence,
        project_id: nextProjectId,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
      setError(null);
      imxToast("Task updated", { tone: "success" });
    });
  }

  if (editing) {
    return (
      <li className="border-b border-border/40 px-3 py-3.5 last:border-b-0 sm:px-4">
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
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "task-edit-error" : undefined}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full sm:w-40"
              aria-label="Due date"
            />
            {projects.length > 0 ? (
              <BrandSelect
                value={projectId}
                aria-label="Project"
                className="w-full sm:w-52"
                options={[
                  { value: "", label: "Inbox" },
                  ...projects.map((project) => ({
                    value: project.id,
                    label: project.label,
                  })),
                ]}
                onValueChange={setProjectId}
              />
            ) : null}
            <BrandSelect
              value={recurrence ?? ""}
              aria-label="Repeat"
              className="w-full sm:w-40"
              options={[
                { value: "", label: "Doesn’t repeat" },
                { value: "daily", label: "Everyday" },
                { value: "weekdays", label: "Weekdays" },
              ]}
              onValueChange={(next) =>
                setRecurrence(
                  next === "daily" || next === "weekdays" ? next : null,
                )
              }
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
                aria-label="Cancel edit"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        </div>
        {error ? (
          <p
            id="task-edit-error"
            role="alert"
            className="mt-2 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}
      </li>
    );
  }

  const today = toDateString(startOfDay(new Date()));
  const tomorrow = toDateString(addDays(startOfDay(new Date()), 1));
  const deferBase = task.due_date
    ? parseDateString(task.due_date)
    : startOfDay(new Date());
  const plusOne = toDateString(addDays(deferBase, 1));
  const nextWeek = toDateString(addDays(deferBase, 7));
  const dueToday = task.due_date === today;
  const dueTomorrow = task.due_date === tomorrow;

  return (
    <li
      className={cn(
        "imx-cv-row group flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-border/40 px-3 py-2.5 last:border-b-0 sm:flex-nowrap sm:px-4",
        task.completed && "opacity-55",
        task.due_date && !task.completed && isOverdue(task.due_date) && "bg-destructive/[0.03]",
      )}
      style={{ ["--i" as string]: index }}
    >
      <span className="sr-only" aria-live="polite">
        {liveMessage}
      </span>
      <button
        type="button"
        className={cn(
          "relative flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground",
          celebrating && "task-check-burst",
        )}
        onClick={handleToggle}
        aria-label={
          task.completed ? "Mark incomplete" : "Mark complete"
        }
        aria-pressed={task.completed}
      >
        {task.completed || celebrating ? (
          <CheckCircle2 className="size-5 text-foreground" />
        ) : (
          <Circle className="size-5 transition-colors group-hover:text-foreground" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium leading-snug text-foreground transition-colors",
            task.completed && "font-normal text-muted-foreground line-through",
          )}
        >
          {task.title}
        </p>
        {meta.length > 0 ? (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {meta.map((part, i) => (
              <span key={`${part.text}-${i}`}>
                {i > 0 ? (
                  <span className="text-muted-foreground/40"> · </span>
                ) : null}
                {part.href ? (
                  <Link
                    href={part.href}
                    className="transition-colors hover:text-foreground"
                  >
                    {part.text}
                  </Link>
                ) : (
                  <span className={cn(part.alert && "text-destructive/80")}>
                    {part.text}
                  </span>
                )}
              </span>
            ))}
          </p>
        ) : null}
      </div>

      {!task.completed ? (
        <div
          className={cn(
            "order-last flex w-full shrink-0 items-center gap-1 pl-11 sm:order-0 sm:w-auto sm:pl-0",
            "sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100",
          )}
        >
          <button
            type="button"
            onClick={() => scheduleDue(today)}
            className={cn(
              "rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
              dueToday
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-label="Due today"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => scheduleDue(tomorrow)}
            className={cn(
              "rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
              dueTomorrow
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-label="Due tomorrow"
          >
            Tmrw
          </button>
          <button
            type="button"
            onClick={() => scheduleDue(plusOne)}
            className={cn(
              "rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
              task.due_date === plusOne && !dueTomorrow
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-label="Defer one day"
          >
            +1d
          </button>
          <button
            type="button"
            onClick={() => scheduleDue(nextWeek)}
            className={cn(
              "rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
              task.due_date === nextWeek
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-label="Defer one week"
          >
            +1w
          </button>
          {task.due_date ? (
            <button
              type="button"
              onClick={() => scheduleDue(null)}
              className="rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Clear due date"
            >
              Clear
            </button>
          ) : null}
        </div>
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
        recurrence?: TaskRecurrence;
        project_id?: string | null;
        context?: string | null;
        context_href?: string | null;
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
              ? {
                  ...t,
                  title: action.title,
                  due_date: action.due_date,
                  recurrence:
                    action.recurrence !== undefined
                      ? action.recurrence
                      : t.recurrence,
                  project_id:
                    action.project_id !== undefined
                      ? action.project_id
                      : t.project_id,
                  context:
                    action.context !== undefined ? action.context : t.context,
                  context_href:
                    action.context_href !== undefined
                      ? action.context_href
                      : t.context_href,
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
    onOptimisticUpdate: (id: string, patch: TaskUpdatePatch) =>
      dispatch({ type: "update", id, ...patch }),
  };
}
