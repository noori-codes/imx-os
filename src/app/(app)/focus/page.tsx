import {
  getDailyFocusGoal,
  getFocusOverviewStats,
  getRecentFocusSessions,
} from "@/actions/focus";
import { getFocusLinkableTasks } from "@/actions/tasks";
import { FocusSessionList } from "@/components/focus/focus-session-list";
import { FocusStats } from "@/components/focus/focus-stats";
import { FocusTimer } from "@/components/focus/focus-timer";
import { FocusWorkspace } from "@/components/focus/focus-workspace";
import { LogFocusForm } from "@/components/focus/log-focus-form";
import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";

type FocusPageProps = {
  searchParams: Promise<{ task?: string }>;
};

export default async function FocusPage({ searchParams }: FocusPageProps) {
  const { task: taskParam } = await searchParams;
  const [sessions, stats, tasks, dailyGoal] = await Promise.all([
    getRecentFocusSessions(20),
    getFocusOverviewStats(),
    getFocusLinkableTasks(),
    getDailyFocusGoal(),
  ]);

  return (
    <>
      <Header title="Focus" description="One session at a time" />
      <AppPageFrame className="max-w-6xl gap-8 md:py-10">
        <FocusWorkspace
          timer={
            <FocusTimer
              tasks={tasks}
              focusMinutesToday={stats.focus_minutes}
              initialTaskId={taskParam ?? null}
            />
          }
          rail={<FocusStats stats={stats} dailyGoal={dailyGoal} />}
          sessions={
            <div className="space-y-8">
              <FocusSessionList sessions={sessions} />
              <div className="border-t border-border/40 pt-6">
                <LogFocusForm tasks={tasks} />
              </div>
            </div>
          }
        />
      </AppPageFrame>
    </>
  );
}
