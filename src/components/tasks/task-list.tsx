"use client";

import { useState } from "react";
import { ChevronDown, ListTodo, Search } from "lucide-react";

import { TaskItem, useTaskOptimistic } from "@/components/tasks/task-item";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  groupActiveTasks,
  viewEmptyCopy,
} from "@/lib/task-views";
import { isToday } from "@/lib/date-utils";
import type { TaskFocusToday } from "@/types/focus";
import type { TaskView, TaskWithContext } from "@/types/task";

type TaskOptimisticApi = ReturnType<typeof useTaskOptimistic>;

type TaskListProps = {
  tasks: TaskWithContext[];
  view?: TaskView;
  mode?: "smart" | "project";
  todayFocus?: TaskFocusToday;
  searching?: boolean;
  /** When provided (Tasks board), share optimistic state with Focus Next. */
  optimistic?: TaskOptimisticApi;
};

function ListEmpty({
  view,
  searching,
}: {
  view: TaskView;
  searching?: boolean;
}) {
  if (searching) {
    return (
      <EmptyState
        icon={Search}
        title="No matches"
        description="Try another search in this view."
      />
    );
  }

  const empty = viewEmptyCopy(view);
  return (
    <EmptyState
      icon={ListTodo}
      title={empty.title}
      description={empty.description}
    />
  );
}

export function TaskList({
  tasks,
  view = "all",
  mode = "smart",
  todayFocus,
  searching = false,
  optimistic: optimisticProp,
}: TaskListProps) {
  const localOptimistic = useTaskOptimistic(tasks);
  const onOptimisticToggle =
    optimisticProp?.onOptimisticToggle ?? localOptimistic.onOptimisticToggle;
  const onOptimisticDelete =
    optimisticProp?.onOptimisticDelete ?? localOptimistic.onOptimisticDelete;
  const onOptimisticUpdate =
    optimisticProp?.onOptimisticUpdate ?? localOptimistic.onOptimisticUpdate;
  // When board owns optimistic state, `tasks` is already the filtered snapshot.
  const optimisticTasks = optimisticProp
    ? tasks
    : localOptimistic.optimisticTasks;

  const [completedOpen, setCompletedOpen] = useState(false);
  const active = optimisticTasks.filter((t) => !t.completed);
  const completed = optimisticTasks.filter((t) => {
    if (!t.completed) return false;
    if (view === "today" && t.due_date && isToday(t.due_date)) return false;
    return true;
  });

  if (optimisticTasks.length === 0) {
    return (
      <ListEmpty
        view={mode === "project" ? "all" : view}
        searching={searching}
      />
    );
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
