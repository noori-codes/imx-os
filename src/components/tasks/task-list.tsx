"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { TaskItem, useTaskOptimistic } from "@/components/tasks/task-item";
import { Button } from "@/components/ui/button";
import {
  groupActiveTasks,
  viewEmptyCopy,
} from "@/lib/task-views";
import type { TaskFocusToday } from "@/types/focus";
import type { TaskView, TaskWithContext } from "@/types/task";

type TaskListProps = {
  tasks: TaskWithContext[];
  view?: TaskView;
  /** Project pages: flat active/completed, no smart groups */
  mode?: "smart" | "project";
  todayFocus?: TaskFocusToday;
};

function GhostEmpty({ view }: { view: TaskView }) {
  const empty = viewEmptyCopy(view);
  const widths = [68, 54, 40];

  return (
    <div className="mt-1">
      <ul className="pointer-events-none border-t border-border/30" aria-hidden="true">
        {widths.map((width, i) => (
          <li
            key={i}
            className="flex items-center gap-3 border-b border-border/20 py-3 last:border-b-0"
            style={{ opacity: 0.4 - i * 0.1 }}
          >
            <span className="size-4 shrink-0 rounded-full border border-border/50" />
            <span
              className="h-2.5 rounded-full bg-muted"
              style={{ width: `${width}%` }}
            />
          </li>
        ))}
      </ul>
      <div className="mt-5">
        <p className="text-sm text-muted-foreground">{empty.title}</p>
        <p className="mt-1 text-[13px] text-muted-foreground/75">
          {empty.description}
        </p>
      </div>
    </div>
  );
}

export function TaskList({
  tasks,
  view = "all",
  mode = "smart",
  todayFocus,
}: TaskListProps) {
  const {
    optimisticTasks,
    onOptimisticToggle,
    onOptimisticDelete,
    onOptimisticUpdate,
  } = useTaskOptimistic(tasks);

  const [completedOpen, setCompletedOpen] = useState(false);

  const active = optimisticTasks.filter((t) => !t.completed);
  const completed = optimisticTasks.filter((t) => t.completed);

  if (optimisticTasks.length === 0) {
    if (mode === "project") {
      return (
        <div className="mt-1">
          <ul
            className="pointer-events-none border-t border-border/30"
            aria-hidden="true"
          >
            {[68, 54, 40].map((width, i) => (
              <li
                key={i}
                className="flex items-center gap-3 border-b border-border/20 py-3 last:border-b-0"
                style={{ opacity: 0.4 - i * 0.1 }}
              >
                <span className="size-4 shrink-0 rounded-full border border-border/50" />
                <span
                  className="h-2.5 rounded-full bg-muted"
                  style={{ width: `${width}%` }}
                />
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-muted-foreground">No tasks yet</p>
          <p className="mt-1 text-[13px] text-muted-foreground/75">
            Add a task above to start this project.
          </p>
        </div>
      );
    }

    return <GhostEmpty view={view} />;
  }

  const groups =
    mode === "project"
      ? active.length
        ? [{ id: "active", label: "Active", tasks: active }]
        : []
      : groupActiveTasks(optimisticTasks, view);

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.id}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <h2
              className={
                group.id === "overdue"
                  ? "text-[10px] font-medium uppercase tracking-[0.18em] text-destructive/90"
                  : "text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
              }
            >
              {group.label}
            </h2>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {group.tasks.length}
            </span>
          </div>
          <ul className="dash-stagger border-t border-border/30">
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
        <section>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 text-[11px] text-muted-foreground"
            onClick={() => setCompletedOpen((v) => !v)}
            aria-expanded={completedOpen}
          >
            <ChevronDown
              className={`size-3.5 transition-transform ${completedOpen ? "rotate-180" : ""}`}
            />
            Completed · {completed.length}
          </Button>
          {completedOpen ? (
            <ul className="mt-1 border-t border-border/30">
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
