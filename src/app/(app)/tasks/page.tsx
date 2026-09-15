import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";

import { getTodayTaskFocus } from "@/actions/focus";
import {
  getTaskBoardStats,
  getTaskProjectOptions,
  getTasksForView,
} from "@/actions/tasks";
import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { TasksBoard } from "@/components/tasks/tasks-board";
import { TasksSkeleton } from "@/components/tasks/tasks-skeleton";
import { TasksStage } from "@/components/tasks/tasks-stage";
import { parseDefaultTaskViewCookie } from "@/lib/app-preferences";
import { parseTaskView } from "@/lib/task-views";
import type { TaskView } from "@/types/task";

export const metadata: Metadata = {
  title: "Tasks",
  description: "Inbox, today, and upcoming work",
};

type TasksPageProps = {
  searchParams: Promise<{ view?: string; compose?: string }>;
};

async function TasksBody({
  view,
  compose,
}: {
  view: TaskView;
  compose: boolean;
}) {
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
    <AppPageFrame className="max-w-5xl gap-8 md:py-8">
      <TasksStage>
        <div className="tasks-reveal">
          <TasksBoard
            tasks={tasks}
            view={view}
            counts={stats.counts}
            projects={projects}
            todayFocus={todayFocus}
            compose={compose}
            pulseStats={{
              openCount: stats.openCount,
              overdueCount: stats.overdueCount,
              doneToday: stats.doneToday,
              todayOpen: stats.counts.today,
              focusMinutes,
            }}
          />
        </div>
      </TasksStage>
    </AppPageFrame>
  );
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const preferred = parseDefaultTaskViewCookie(
    cookieStore.get("imx-tasks-default-view")?.value,
  );
  const view = parseTaskView(params.view ?? preferred ?? undefined);
  const compose = params.compose === "1";

  return (
    <>
      <Header chrome title="Tasks" />
      <Suspense fallback={<TasksSkeleton />}>
        <TasksBody view={view} compose={compose} />
      </Suspense>
    </>
  );
}
