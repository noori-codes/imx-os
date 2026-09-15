"use client";

import Link from "next/link";
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
import type {
  TaskProjectOption,
  TaskView,
  TaskWithContext,
} from "@/types/task";

type TaskOptimisticApi = ReturnType<typeof useTaskOptimistic>;

type TaskListProps = {
  tasks: TaskWithContext[];
  view?: TaskView;
  mode?: "smart" | "project";
  todayFocus?: TaskFocusToday;
  searching?: boolean;
  projects?: TaskProjectOption[];
  /** Board-wide open count (all views) — surfaces inbox when Today/Week is empty. */
  boardOpenCount?: number;
  inboxCount?: number;
  /** When provided (Tasks board), share optimistic state with Focus Next. */
  optimistic?: TaskOptimisticApi;
};

function focusTasksComposer() {
  const root =
    document.getElementById("tasks-composer") ??
    document.querySelector<HTMLElement>(".goals-composer");
  root?.scrollIntoView({ behavior: "smooth", block: "center" });
  root
    ?.querySelector<HTMLInputElement>("input[name=title]")
    ?.focus({ preventScroll: true });
}

function ListEmpty({
  view,
  searching,
  mode,
  boardOpenCount = 0,
  inboxCount = 0,
}: {
  view: TaskView;
  searching?: boolean;
  mode?: "smart" | "project";
  boardOpenCount?: number;
  inboxCount?: number;
}) {
  if (searching) {
    return (
      <EmptyState
        icon={Search}
        title="No matches"
        description="Try another search in this view."
      >
        <p className="mt-3 text-xs text-muted-foreground">
          Clear the search field above to see all tasks in this view.
        </p>
      </EmptyState>
    );
  }

  if (mode === "project") {
    return (
      <EmptyState
        icon={ListTodo}
        title="No tasks yet"
        description="Capture the first move for this project above."
      >
        <Button type="button" className="mt-5" onClick={focusTasksComposer}>
          Add task
        </Button>
      </EmptyState>
    );
  }

  const empty = viewEmptyCopy(view);
  const showElsewhere =
    boardOpenCount > 0 &&
    (view === "today" || view === "week" || view === "upcoming");
  const elsewhereHref =
    inboxCount > 0 ? "/tasks?view=inbox" : "/tasks?view=all";
  const elsewhereLabel =
    inboxCount > 0
      ? `${inboxCount} in inbox →`
      : `${boardOpenCount} open elsewhere →`;

  return (
    <EmptyState
      icon={ListTodo}
      title={empty.title}
      description={
        showElsewhere
          ? `${empty.description} Open work is waiting in another view.`
          : empty.description
      }
    >
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Button type="button" onClick={focusTasksComposer}>
          Capture a task
        </Button>
        {showElsewhere ? (
          <Link
            href={elsewhereHref}
            className="inline-flex h-10 items-center rounded-xl border border-border/60 bg-card/70 px-4 text-sm font-medium text-foreground transition-colors hover:border-border"
          >
            {elsewhereLabel}
          </Link>
        ) : null}
      </div>
    </EmptyState>
  );
}

export function TaskList({
  tasks,
  view = "all",
  mode = "smart",
  todayFocus,
  searching = false,
  projects = [],
  boardOpenCount = 0,
  inboxCount = 0,
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
        mode={mode}
        searching={searching}
        boardOpenCount={boardOpenCount}
        inboxCount={inboxCount}
      />
    );
  }

  const groups =
    mode === "project"
      ? active.length
        ? [{ id: "active", label: "Active", tasks: active }]
        : []
      : groupActiveTasks(optimisticTasks, view);

  const silentBlank =
    mode === "smart" &&
    groups.length === 0 &&
    completed.length === 0 &&
    !searching;

  return (
    <div className="space-y-5">
      {silentBlank ? (
        <ListEmpty
          view={view}
          boardOpenCount={boardOpenCount}
          inboxCount={inboxCount}
        />
      ) : null}

      {groups.map((group) => (
        <section
          key={group.id}
          className="tasks-group overflow-hidden rounded-2xl border border-border/40 bg-card/70"
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
                projects={projects}
                onOptimisticToggle={onOptimisticToggle}
                onOptimisticDelete={onOptimisticDelete}
                onOptimisticUpdate={onOptimisticUpdate}
              />
            ))}
          </ul>
        </section>
      ))}

      {completed.length > 0 ? (
        <section className="tasks-group overflow-hidden rounded-2xl border border-border/40 bg-card/55">
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
                  projects={projects}
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
