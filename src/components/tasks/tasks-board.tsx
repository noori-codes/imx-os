"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { TaskForm } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";
import { useTaskOptimistic } from "@/components/tasks/task-item";
import {
  TasksPulse,
  type TasksPulseStats,
} from "@/components/tasks/tasks-pulse";
import { TasksViewTabs } from "@/components/tasks/tasks-view-tabs";
import { Input } from "@/components/ui/input";
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
  pulseStats: TasksPulseStats;
  todayFocus?: TaskFocusToday;
  /** From ⌘K “Add task” — focus the capture field once. */
  compose?: boolean;
};

export function TasksBoard({
  tasks,
  view,
  counts,
  projects,
  pulseStats,
  todayFocus,
  compose = false,
}: TasksBoardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [focusComposer, setFocusComposer] = useState(compose);
  const optimistic = useTaskOptimistic(tasks);

  useEffect(() => {
    if (!compose) return;
    setFocusComposer(true);
    const params = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : "",
    );
    params.delete("compose");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [compose, pathname, router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return optimistic.optimisticTasks;
    return optimistic.optimisticTasks.filter(
      (task) =>
        task.title.toLowerCase().includes(q) ||
        (task.context?.toLowerCase().includes(q) ?? false),
    );
  }, [optimistic.optimisticTasks, query]);

  const focusNext = useMemo(
    () => pickFocusNext(optimistic.optimisticTasks),
    [optimistic.optimisticTasks],
  );

  return (
    <div className="flex flex-col gap-6">
      <TasksPulse stats={pulseStats} focusNext={focusNext} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <TasksViewTabs active={view} counts={counts} />
        <div className="relative min-w-0 sm:max-w-xs lg:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks…"
            className="h-9 border-surface-border bg-surface pl-9"
            aria-label="Search tasks"
          />
        </div>
      </div>

      <div
        id="tasks-composer"
        className="tasks-composer relative overflow-hidden rounded-2xl imx-surface imx-surface-rim p-4 sm:p-5"
      >
        <div className="tasks-composer-glow" aria-hidden />
        <div className="relative z-1">
          <div className="mb-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Capture
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add fast. Schedule with chips. Press{" "}
              <kbd className="rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px]">
                N
              </kbd>{" "}
              to focus.
            </p>
          </div>
          <TaskForm
            projects={projects}
            variant="quick"
            autoFocusTitle={focusComposer}
          />
        </div>
      </div>

      <TaskList
        tasks={filtered}
        view={view}
        mode="smart"
        todayFocus={todayFocus}
        searching={query.trim().length > 0}
        projects={projects}
        boardOpenCount={pulseStats.openCount}
        inboxCount={counts.inbox}
        optimistic={optimistic}
      />
    </div>
  );
}
