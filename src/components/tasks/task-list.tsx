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
    const empty =
      mode === "project"
        ? {
            title: "No tasks yet",
            description: "Add a task above to start this project.",
          }
        : viewEmptyCopy(view);

    return (
      <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
        <p className="text-sm text-muted-foreground">{empty.title}</p>
        <p className="mt-1 max-w-sm text-[13px] text-muted-foreground/80">
          {empty.description}
        </p>
      </div>
    );
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
                  ? "text-[10px] font-medium uppercase tracking-[0.18em] text-destructive"
                  : "text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
              }
            >
              {group.label}
            </h2>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {group.tasks.length}
            </span>
          </div>
          <ul className="border-t border-border/30">
            {group.tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
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
            className="-ml-2 h-8 text-muted-foreground"
            onClick={() => setCompletedOpen((v) => !v)}
            aria-expanded={completedOpen}
          >
            <ChevronDown
              className={`size-3.5 transition-transform ${completedOpen ? "rotate-180" : ""}`}
            />
            Completed ({completed.length})
          </Button>
          {completedOpen ? (
            <ul className="mt-1 border-t border-border/30">
              {completed.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
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
