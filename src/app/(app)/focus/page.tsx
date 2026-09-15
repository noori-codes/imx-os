import { Suspense } from "react";
import type { Metadata } from "next";

import {
  getDailyFocusGoal,
  getFocusOverviewStats,
  getRecentFocusSessions,
} from "@/actions/focus";
import { getFocusLinkableTasks } from "@/actions/tasks";
import { FocusStatsLazy, FocusTimerLazy } from "@/components/focus/focus-lazy";
import { FocusSessionList } from "@/components/focus/focus-session-list";
import { FocusSkeleton } from "@/components/focus/focus-skeleton";
import { FocusWorkspace } from "@/components/focus/focus-workspace";
import { LogFocusForm } from "@/components/focus/log-focus-form";
import { Header } from "@/components/layout/header";
import { formatFocusMinutesCompact } from "@/types/focus";

export const metadata: Metadata = {
  title: "Focus",
  description: "Pomodoro timer and session history",
};

type FocusPageProps = {
  searchParams: Promise<{ task?: string }>;
};

async function FocusBody({ taskParam }: { taskParam: string | null }) {
  const [sessions, stats, tasks, dailyGoal] = await Promise.all([
    getRecentFocusSessions(20),
    getFocusOverviewStats(),
    getFocusLinkableTasks(),
    getDailyFocusGoal(),
  ]);

  const remaining = Math.max(0, dailyGoal.minutes - stats.focus_minutes);
  const goalHint =
    stats.focus_minutes === 0
      ? "One session lights the day"
      : remaining > 0
        ? `${formatFocusMinutesCompact(remaining) || `${remaining}m`} still open on the goal`
        : "Daily goal sealed — keep going if you want";

  return (
    <FocusWorkspace
      timer={
        <FocusTimerLazy
          tasks={tasks}
          focusMinutesToday={stats.focus_minutes}
          dailyGoalMinutes={dailyGoal.minutes}
          goalHint={goalHint}
          initialTaskId={taskParam}
        />
      }
      sky={<FocusStatsLazy stats={stats} dailyGoal={dailyGoal} />}
      sessions={
        <div className="focus-secondary space-y-6">
          <FocusSessionList sessions={sessions} />
          <section className="focus-panel relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-4 sm:p-5">
            <div className="focus-panel-glow" aria-hidden="true" />
            <div className="relative z-1">
              <LogFocusForm tasks={tasks} />
            </div>
          </section>
        </div>
      }
    />
  );
}

export default async function FocusPage({ searchParams }: FocusPageProps) {
  const { task: taskParam } = await searchParams;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header chrome title="Focus" />
      <Suspense fallback={<FocusSkeleton />}>
        <FocusBody taskParam={taskParam ?? null} />
      </Suspense>
    </div>
  );
}
