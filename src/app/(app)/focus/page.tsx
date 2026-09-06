import dynamic from "next/dynamic";

import {
  FocusStatsChunkFallback,
  FocusTimerChunkFallback,
} from "@/components/focus/focus-chunk-fallbacks";
import { FocusSessionList } from "@/components/focus/focus-session-list";
import { FocusWorkspace } from "@/components/focus/focus-workspace";
import { LogFocusForm } from "@/components/focus/log-focus-form";
import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import {
  getDailyFocusGoal,
  getFocusOverviewStats,
  getRecentFocusSessions,
} from "@/actions/focus";
import { getFocusLinkableTasks } from "@/actions/tasks";

const FocusTimer = dynamic(
  () =>
    import("@/components/focus/focus-timer").then((m) => ({
      default: m.FocusTimer,
    })),
  { loading: () => <FocusTimerChunkFallback /> },
);

const FocusStats = dynamic(
  () =>
    import("@/components/focus/focus-stats").then((m) => ({
      default: m.FocusStats,
    })),
  { loading: () => <FocusStatsChunkFallback /> },
);

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
      <AppPageFrame className="max-w-5xl gap-0 md:py-8">
        <FocusWorkspace
          timer={
            <FocusTimer
              tasks={tasks}
              focusMinutesToday={stats.focus_minutes}
              dailyGoalMinutes={dailyGoal.minutes}
              initialTaskId={taskParam ?? null}
            />
          }
          sky={<FocusStats stats={stats} dailyGoal={dailyGoal} />}
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
