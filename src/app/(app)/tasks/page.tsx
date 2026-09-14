import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { TasksBoard } from "@/components/tasks/tasks-board";
import { TasksStage } from "@/components/tasks/tasks-stage";
import { TasksStats } from "@/components/tasks/tasks-stats";
import { getTodayTaskFocus } from "@/actions/focus";
import {
  getTaskBoardStats,
  getTaskProjectOptions,
  getTasksForView,
} from "@/actions/tasks";
import { parseDefaultTaskViewCookie } from "@/lib/app-preferences";
import { parseTaskView } from "@/lib/task-views";
import { cookies } from "next/headers";

type TasksPageProps = {
  searchParams: Promise<{ view?: string; compose?: string }>;
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const preferred = parseDefaultTaskViewCookie(
    cookieStore.get("imx-tasks-default-view")?.value,
  );
  const view = parseTaskView(params.view ?? preferred ?? undefined);
  const compose = params.compose === "1";
  const [tasks, stats, projects, todayFocus] = await Promise.all([
    getTasksForView(view),
    getTaskBoardStats(),
    getTaskProjectOptions(),
    getTodayTaskFocus(),
  ]);

  const focusMinutes = Math.round(
    Object.values(todayFocus).reduce((sum, seconds) => sum + seconds, 0) / 60,
  );

  return (
    <>
      <Header title="Tasks" />
      <AppPageFrame className="max-w-5xl gap-8 md:py-8">
        <TasksStage>
          <div className="tasks-reveal">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Command deck</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Tasks
                </h2>
                <p className="mt-1.5 max-w-lg text-sm text-muted-foreground">
                  Capture, schedule, and start focus without leaving the list.
                </p>
              </div>
            </header>
          </div>

          <div className="tasks-reveal tasks-reveal-delay-1">
            <TasksStats
              openCount={stats.openCount}
              overdueCount={stats.overdueCount}
              doneToday={stats.doneToday}
              focusMinutes={focusMinutes}
            />
          </div>

          <div className="tasks-reveal tasks-reveal-delay-2">
            <TasksBoard
              tasks={tasks}
              view={view}
              counts={stats.counts}
              projects={projects}
              todayFocus={todayFocus}
              compose={compose}
            />
          </div>
        </TasksStage>
      </AppPageFrame>
    </>
  );
}
