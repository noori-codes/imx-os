"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";

import { createTask, type TaskActionState } from "@/actions/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDays, startOfDay, toDateString } from "@/lib/date-utils";
import { weekdayOnOrAfter } from "@/lib/task-recurrence";
import { cn } from "@/lib/utils";
import type { TaskProjectOption, TaskRecurrence } from "@/types/task";

type TaskFormProps = {
  projectId?: string;
  defaultDueDate?: string;
  compact?: boolean;
  projects?: TaskProjectOption[];
  /** Prefer quick-add chrome on the main Tasks page */
  variant?: "card" | "quick" | "compact";
};

type ScheduleChip = "none" | "today" | "tomorrow" | "daily" | "weekdays";

function chipToFields(chip: ScheduleChip): {
  due_date: string;
  recurrence: TaskRecurrence;
} {
  const today = toDateString(startOfDay(new Date()));
  const tomorrow = toDateString(addDays(startOfDay(new Date()), 1));

  switch (chip) {
    case "today":
      return { due_date: today, recurrence: null };
    case "tomorrow":
      return { due_date: tomorrow, recurrence: null };
    case "daily":
      return { due_date: today, recurrence: "daily" };
    case "weekdays":
      return { due_date: weekdayOnOrAfter(new Date()), recurrence: "weekdays" };
    default:
      return { due_date: "", recurrence: null };
  }
}

const CHIPS: { id: ScheduleChip; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "daily", label: "Everyday" },
  { id: "weekdays", label: "Weekdays" },
];

export function TaskForm({
  projectId,
  defaultDueDate,
  compact = false,
  projects = [],
  variant,
}: TaskFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const [moreOpen, setMoreOpen] = useState(Boolean(defaultDueDate && !compact));
  const [chip, setChip] = useState<ScheduleChip>("none");
  const [focused, setFocused] = useState(false);

  const mode =
    variant ?? (compact ? "compact" : projectId ? "card" : "quick");

  const schedule = chipToFields(chip);
  const showChips = mode === "quick" && !defaultDueDate;
  const showProjectMore = !projectId && projects.length > 0;

  const [state, formAction, pending] = useActionState<
    TaskActionState | null,
    FormData
  >(async (prev, formData) => {
    const result = await createTask(prev, formData);
    if (!result.error) {
      formRef.current?.reset();
      setChip("none");
      if (mode === "quick") setMoreOpen(false);
      queueMicrotask(() => titleRef.current?.focus());
    }
    return result;
  }, null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (mode !== "quick") return;
      if (e.key !== "n" && e.key !== "N") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;
      e.preventDefault();
      titleRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);

  if (mode === "compact") {
    return (
      <form ref={formRef} action={formAction} className="space-y-3">
        {projectId ? (
          <input type="hidden" name="project_id" value={projectId} />
        ) : null}
        {defaultDueDate ? (
          <input type="hidden" name="due_date" value={defaultDueDate} />
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            ref={titleRef}
            name="title"
            placeholder="Task due this day"
            required
            autoComplete="off"
            className="flex-1"
          />
          <Button type="submit" disabled={pending}>
            <Plus className="size-4" />
            {pending ? "Adding..." : "Add"}
          </Button>
        </div>
        {state?.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}
      </form>
    );
  }

  if (mode === "card") {
    return (
      <form
        ref={formRef}
        action={formAction}
        className="rounded-xl border bg-card p-4 shadow-sm"
      >
        {projectId ? (
          <input type="hidden" name="project_id" value={projectId} />
        ) : null}
        {defaultDueDate ? (
          <input type="hidden" name="due_date" value={defaultDueDate} />
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Plus className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={titleRef}
              name="title"
              placeholder="What needs doing?"
              required
              autoComplete="off"
              className="h-10 border-0 bg-muted/40 pl-9 shadow-none focus-visible:ring-1"
              aria-label="New task"
            />
          </div>
          <Button type="submit" disabled={pending} size="sm" className="h-9">
            {pending ? "Adding..." : "Add"}
          </Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {!defaultDueDate ? (
            <div className="space-y-1.5">
              <label
                htmlFor="task-due-card"
                className="text-xs font-medium text-muted-foreground"
              >
                Due date
              </label>
              <Input id="task-due-card" name="due_date" type="date" />
            </div>
          ) : null}
          {!projectId && projects.length > 0 ? (
            <div className="space-y-1.5">
              <label
                htmlFor="task-project-card"
                className="text-xs font-medium text-muted-foreground"
              >
                Project
              </label>
              <select
                id="task-project-card"
                name="project_id"
                defaultValue=""
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="">Inbox (no project)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        {state?.error ? (
          <p className="mt-3 text-sm text-destructive">{state.error}</p>
        ) : null}
      </form>
    );
  }

  // quick — stage composer
  return (
    <form
      ref={formRef}
      action={formAction}
      className={cn(
        "task-composer rounded-2xl border border-border/40 bg-muted/25 p-3.5 transition-[border-color,background-color,box-shadow] duration-200 sm:p-4",
        focused &&
          "border-border/70 bg-muted/40 shadow-[0_0_0_1px_color-mix(in_oklab,var(--foreground)_6%,transparent)]",
      )}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFocused(false);
        }
      }}
    >
      {projectId ? (
        <input type="hidden" name="project_id" value={projectId} />
      ) : null}

      {showChips ? (
        <>
          <input type="hidden" name="due_date" value={schedule.due_date} />
          <input
            type="hidden"
            name="recurrence"
            value={schedule.recurrence ?? ""}
          />
        </>
      ) : defaultDueDate ? (
        <input type="hidden" name="due_date" value={defaultDueDate} />
      ) : null}

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Plus
            className={cn(
              "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 transition-colors",
              focused ? "text-foreground/70" : "text-muted-foreground",
            )}
          />
          <Input
            ref={titleRef}
            name="title"
            placeholder="What needs doing?"
            required
            autoComplete="off"
            className="h-11 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
            aria-label="New task"
          />
        </div>
        <Button
          type="submit"
          disabled={pending}
          size="sm"
          className="h-9 shrink-0 rounded-full px-4"
        >
          {pending ? "Adding…" : "Add"}
        </Button>
      </div>

      {showChips ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/30 pt-3">
          {CHIPS.map((item) => {
            const active = chip === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setChip(active ? "none" : item.id)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] tracking-wide transition-colors",
                  active
                    ? "bg-foreground font-medium text-background"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            );
          })}

          {showProjectMore ? (
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className={cn(
                "ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground",
                moreOpen && "text-foreground",
              )}
              aria-expanded={moreOpen}
            >
              Project
              <ChevronDown
                className={cn(
                  "size-3 transition-transform",
                  moreOpen && "rotate-180",
                )}
              />
            </button>
          ) : null}
        </div>
      ) : null}

      {moreOpen && showProjectMore ? (
        <div className="mt-3">
          <label htmlFor="task-project" className="sr-only">
            Project
          </label>
          <select
            id="task-project"
            name="project_id"
            defaultValue=""
            className="border-input bg-background/60 h-9 w-full rounded-lg border border-border/50 px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            <option value="">Inbox (no project)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <p
        className={cn(
          "mt-2.5 text-[11px] text-muted-foreground/70 transition-opacity",
          focused || chip !== "none" ? "opacity-100" : "opacity-0",
        )}
      >
        {chip === "daily" || chip === "weekdays"
          ? "Done rolls to the next day"
          : (
              <>
                Press <kbd className="rounded border border-border/60 px-1">N</kbd>{" "}
                anytime
              </>
            )}
      </p>

      {state?.error ? (
        <p className="mt-2 text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
