import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";
import { TasksStage } from "@/components/tasks/tasks-stage";
import { getTodayTaskFocus } from "@/actions/focus";
import { getAllTasks, getTaskProjectOptions } from "@/actions/tasks";
import { addDays, isOverdue, startOfDay, toDateString } from "@/lib/date-utils";
import {
  filterTasksForView,
  parseTaskView,
} from "@/lib/task-views";
import type { TaskView } from "@/types/task";

type TasksPageProps = {
  searchParams: Promise<{ view?: string }>;
};

function countForView(
  tasks: Awaited<ReturnType<typeof getAllTasks>>,
  view: TaskView,
) {
  return filterTasksForView(tasks, view).filter((t) => !t.completed).length;
}

function nextUpcomingLabel(
  tasks: Awaited<ReturnType<typeof getAllTasks>>,
): string | null {
  const today = toDateString(startOfDay(new Date()));
  const next = tasks
    .filter((t) => !t.completed && t.due_date != null && t.due_date > today)
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))[0];

  if (!next?.due_date) return null;
  const tomorrow = toDateString(addDays(startOfDay(new Date()), 1));
  if (next.due_date === tomorrow) return "Tomorrow";
  return new Date(`${next.due_date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;
  const view = parseTaskView(params.view);
  const [tasks, projects, todayFocus] = await Promise.all([
    getAllTasks(),
    getTaskProjectOptions(),
    getTodayTaskFocus(),
  ]);
  const filtered = filterTasksForView(tasks, view);
  const openCount = filtered.filter((t) => !t.completed).length;
  const overdueCount = filtered.filter(
    (t) => !t.completed && t.due_date && isOverdue(t.due_date),
  ).length;

  const counts = {
    inbox: countForView(tasks, "inbox"),
    today: countForView(tasks, "today"),
    upcoming: countForView(tasks, "upcoming"),
    all: countForView(tasks, "all"),
  } satisfies Record<TaskView, number>;

  return (
    <>
      <Header title="Tasks" />
      <AppPageFrame className="max-w-5xl gap-10 md:py-8">
        <TasksStage
          view={view}
          openCount={openCount}
          overdueCount={overdueCount}
          counts={counts}
          nextDueLabel={view === "upcoming" ? nextUpcomingLabel(tasks) : null}
        />

        <TaskForm projects={projects} variant="quick" />

        <div className="border-t border-border/30 pt-8">
          <TaskList
            tasks={filtered}
            view={view}
            mode="smart"
            todayFocus={todayFocus}
          />
        </div>
      </AppPageFrame>
    </>
  );
}
