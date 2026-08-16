"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";

import { createTask, type TaskActionState } from "@/actions/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { TaskProjectOption } from "@/types/task";

type TaskFormProps = {
  projectId?: string;
  defaultDueDate?: string;
  compact?: boolean;
  projects?: TaskProjectOption[];
  /** Prefer quick-add chrome on the main Tasks page */
  variant?: "card" | "quick" | "compact";
};

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

  const mode =
    variant ?? (compact ? "compact" : projectId ? "card" : "quick");

  const [state, formAction, pending] = useActionState<
    TaskActionState | null,
    FormData
  >(async (prev, formData) => {
    const result = await createTask(prev, formData);
    if (!result.error) {
      formRef.current?.reset();
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

  return (
    <form
      ref={formRef}
      action={formAction}
      className={cn(
        mode === "card" && "rounded-xl border bg-card p-4 shadow-sm",
        mode === "quick" && "border-b border-border/60 pb-5",
      )}
    >
      {projectId ? (
        <input type="hidden" name="project_id" value={projectId} />
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
        <div className="flex items-center gap-2">
          {!defaultDueDate ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
            >
              More
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform",
                  moreOpen && "rotate-180",
                )}
              />
            </Button>
          ) : null}
          <Button type="submit" disabled={pending} size="sm" className="h-9">
            {pending ? "Adding..." : "Add"}
          </Button>
        </div>
      </div>

      {moreOpen || defaultDueDate || (mode === "card" && !compact) ? (
        <div
          className={cn(
            "grid gap-3 sm:grid-cols-2",
            mode === "quick" ? "mt-3" : "mt-4",
            !moreOpen && mode === "quick" && !defaultDueDate && "hidden",
          )}
        >
          {defaultDueDate ? (
            <input type="hidden" name="due_date" value={defaultDueDate} />
          ) : (
            <div className="space-y-1.5">
              <label
                htmlFor="task-due"
                className="text-xs font-medium text-muted-foreground"
              >
                Due date
              </label>
              <Input id="task-due" name="due_date" type="date" />
            </div>
          )}

          {!projectId && projects.length > 0 ? (
            <div className="space-y-1.5">
              <label
                htmlFor="task-project"
                className="text-xs font-medium text-muted-foreground"
              >
                Project
              </label>
              <select
                id="task-project"
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
      ) : null}

      {mode === "quick" ? (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Press <kbd className="rounded border px-1">N</kbd> to focus
        </p>
      ) : null}

      {state?.error ? (
        <p className="mt-3 text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
