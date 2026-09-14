"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";

import { TaskItem, useTaskOptimistic } from "@/components/tasks/task-item";
import { Button } from "@/components/ui/button";
import {
  groupActiveTasks,
  viewEmptyCopy,
} from "@/lib/task-views";
import { isToday } from "@/lib/date-utils";
import type { TaskFocusToday } from "@/types/focus";
import type { TaskView, TaskWithContext } from "@/types/task";

type TaskListProps = {
  tasks: TaskWithContext[];
  view?: TaskView;
  mode?: "smart" | "project";
  todayFocus?: TaskFocusToday;
  searching?: boolean;
};

function GhostEmpty({
  view,
  searching,
}: {
  view: TaskView;
  searching?: boolean;
}) {
  if (searching) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 px-6 py-14 text-center">
        <Search className="mb-3 size-7 text-muted-foreground" />
        <p className="text-base font-medium text-foreground/90">No matches</p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Try another search in this view.
        </p>
      </div>
    );
  }

  const empty = viewEmptyCopy(view);

  return (
    <div className="rounded-2xl border border-dashed border-border/60 px-6 py-14 text-center sm:text-left">
      <p className="text-base font-medium text-foreground/90">{empty.title}</p>
      <p className="mt-1.5 text-sm text-muted-foreground">{empty.description}</p>
    </div>
  );
}

export function TaskList({
  tasks,
  view = "all",
  mode = "smart",
  todayFocus,
  searching = false,
}: TaskListProps) {
  const {
    optimisticTasks,
    onOptimisticToggle,
    onOptimisticDelete,
    onOptimisticUpdate,
  } = useTaskOptimistic(tasks);

  const [completedOpen, setCompletedOpen] = useState(false);
  const active = optimisticTasks.filter((t) => !t.completed);
  const completed = optimisticTasks.filter((t) => {
    if (!t.completed) return false;
    if (view === "today" && t.due_date && isToday(t.due_date)) return false;
    return true;
  });

  if (optimisticTasks.length === 0) {
    return <GhostEmpty view={mode === "project" ? "all" : view} searching={searching} />;
  }

  const groups =
    mode === "project"
      ? active.length
        ? [{ id: "active", label: "Active", tasks: active }]
        : []
      : groupActiveTasks(optimisticTasks, view);

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section
          key={group.id}
          className="tasks-group overflow-hidden rounded-2xl border border-border/50 bg-card/80"
        >
          <div className="flex items-baseline justify-between gap-3 border-b border-border/40 px-4 py-3">
            <h2
              className={
                group.id === "overdue"
                  ? "text-[11px] font-medium uppercase tracking-[0.14em] text-destructive"
                  : group.id === "done"
                    ? "text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/80"
                    : "text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
              }
            >
              {group.label}
            </h2>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {group.tasks.length}
            </span>
          </div>
          <ul className="tasks-stagger">
            {group.tasks.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                view={view}
                index={index}
                todayFocusSeconds={todayFocus?.[task.id] ?? 0}
                onOptimisticToggle={onOptimisticToggle}
                onOptimisticDelete={onOptimisticDelete}
                onOptimisticUpdate={onOptimisticUpdate}
              />
            ))}
          </ul>
        </section>
      ))}

      {completed.length > 0 ? (
        <section className="tasks-group overflow-hidden rounded-2xl border border-border/50 bg-card/60">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10 w-full justify-start rounded-none px-4 text-[11px] text-muted-foreground"
            onClick={() => setCompletedOpen((v) => !v)}
            aria-expanded={completedOpen}
          >
            <ChevronDown
              className={`size-3.5 transition-transform ${completedOpen ? "rotate-180" : ""}`}
            />
            Completed · {completed.length}
          </Button>
          {completedOpen ? (
            <ul className="border-t border-border/40">
              {completed.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  view={view}
                  index={index}
                  todayFocusSeconds={todayFocus?.[task.id] ?? 0}
                  onOptimisticToggle={onOptimisticToggle}
                  onOptimisticDelete={onOptimisticDelete}
                  onOptimisticUpdate={onOptimisticUpdate}
                />
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
