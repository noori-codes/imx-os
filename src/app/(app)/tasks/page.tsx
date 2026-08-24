import { Header } from "@/components/layout/header";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";
import { TaskViewTabs } from "@/components/tasks/task-view-tabs";
import { getTodayTaskFocus } from "@/actions/focus";
import { getAllTasks, getTaskProjectOptions } from "@/actions/tasks";
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

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;
  const view = parseTaskView(params.view);
  const [tasks, projects, todayFocus] = await Promise.all([
    getAllTasks(),
    getTaskProjectOptions(),
    getTodayTaskFocus(),
  ]);
  const filtered = filterTasksForView(tasks, view);

  const counts = {
    inbox: countForView(tasks, "inbox"),
    today: countForView(tasks, "today"),
    upcoming: countForView(tasks, "upcoming"),
    all: countForView(tasks, "all"),
  } satisfies Record<TaskView, number>;

  return (
    <>
      <Header title="Tasks" description="Capture, schedule, and finish" />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <TaskViewTabs active={view} counts={counts} />
        <TaskForm projects={projects} variant="quick" />
        <TaskList tasks={filtered} view={view} mode="smart" todayFocus={todayFocus} />
      </div>
    </>
  );
}
