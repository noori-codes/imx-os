"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search, Timer } from "lucide-react";

import { TaskForm } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";
import { TasksViewTabs } from "@/components/tasks/tasks-view-tabs";
import { Input } from "@/components/ui/input";
import { isOverdue, isToday } from "@/lib/date-utils";
import { pickFocusNext } from "@/lib/task-views";
import type { TaskFocusToday } from "@/types/focus";
import type {
  TaskProjectOption,
  TaskView,
  TaskWithContext,
} from "@/types/task";

type TasksBoardProps = {
  tasks: TaskWithContext[];
  view: TaskView;
  counts: Record<TaskView, number>;
  projects: TaskProjectOption[];
  todayFocus?: TaskFocusToday;
};

function FocusNext({ task }: { task: TaskWithContext }) {
  const overdue = Boolean(task.due_date && isOverdue(task.due_date));
  const today = Boolean(task.due_date && isToday(task.due_date));

  return (
    <section className="tasks-focus-next relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 px-5 py-5 sm:px-7 sm:py-6">
      <div className="tasks-focus-next-glow" aria-hidden />
      <div className="relative z-1 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Focus next
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {task.title}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {overdue
              ? "Overdue — knock this out first"
              : today
                ? "Due today"
                : task.context
                  ? task.context
                  : "Best open task to start"}
            {task.context && (overdue || today) ? ` · ${task.context}` : null}
          </p>
        </div>
        <Link
          href={`/focus?task=${task.id}`}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          <Timer className="size-4" />
          Start focus
          <ArrowUpRight className="size-3.5 opacity-70" />
        </Link>
      </div>
    </section>
  );
}

export function TasksBoard({
  tasks,
  view,
  counts,
  projects,
  todayFocus,
}: TasksBoardProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(q) ||
        (task.context?.toLowerCase().includes(q) ?? false),
    );
  }, [tasks, query]);

  const focusNext = useMemo(() => pickFocusNext(filtered), [filtered]);

  return (
    <div className="flex flex-col gap-6">
      {view === "today" && focusNext ? <FocusNext task={focusNext} /> : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <TasksViewTabs active={view} counts={counts} />
        <div className="relative min-w-0 sm:max-w-xs lg:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks…"
            className="h-9 border-border/50 bg-card/80 pl-9"
            aria-label="Search tasks"
          />
        </div>
      </div>

      <div className="tasks-composer rounded-2xl border border-border/50 bg-card/80 p-4 sm:p-5">
        <div className="mb-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Capture
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add fast. Schedule with chips. Project optional.
          </p>
        </div>
        <TaskForm projects={projects} variant="quick" />
      </div>

      <TaskList
        tasks={filtered}
        view={view}
        mode="smart"
        todayFocus={todayFocus}
        searching={query.trim().length > 0}
      />
    </div>
  );
}
