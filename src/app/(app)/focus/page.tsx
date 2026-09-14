import dynamic from "next/dynamic";

import {
  FocusStatsChunkFallback,
  FocusTimerChunkFallback,
} from "@/components/focus/focus-chunk-fallbacks";
import { FocusKpis } from "@/components/focus/focus-kpis";
import { FocusSessionList } from "@/components/focus/focus-session-list";
import { FocusWorkspace } from "@/components/focus/focus-workspace";
import { LogFocusForm } from "@/components/focus/log-focus-form";
import { Header } from "@/components/layout/header";
import {
  getDailyFocusGoal,
  getFocusOverviewStats,
  getRecentFocusSessions,
} from "@/actions/focus";
import { getFocusLinkableTasks } from "@/actions/tasks";
import { formatFocusMinutesCompact } from "@/types/focus";

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

  const remaining = Math.max(0, dailyGoal.minutes - stats.focus_minutes);
  const goalHint =
    stats.focus_minutes === 0
      ? "One session lights the day"
      : remaining > 0
        ? `${formatFocusMinutesCompact(remaining) || `${remaining}m`} still open on the goal`
        : "Daily goal sealed — keep going if you want";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="Focus" />
      <FocusWorkspace
        header={
          <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Focus studio</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Focus
              </h2>
              <p className="mt-1.5 max-w-lg text-sm text-muted-foreground">
                {goalHint}.
              </p>
            </div>
          </header>
        }
        kpis={
          <FocusKpis
            focusMinutes={stats.focus_minutes}
            goalMinutes={dailyGoal.minutes}
            streak={stats.current_streak}
            sessionsToday={stats.today_marks.length}
          />
        }
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
            <div className="rounded-2xl border border-border/50 bg-card/80 p-4 sm:p-5">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Log manually
              </p>
              <LogFocusForm tasks={tasks} />
            </div>
          </div>
        }
      />
    </div>
  );
}
