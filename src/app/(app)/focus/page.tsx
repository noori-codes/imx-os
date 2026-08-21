import {
  getFocusOverviewStats,
  getRecentFocusSessions,
} from "@/actions/focus";
import { getFocusLinkableTasks } from "@/actions/tasks";
import { FocusSessionList } from "@/components/focus/focus-session-list";
import { FocusSounds } from "@/components/focus/focus-sounds";
import { FocusStats } from "@/components/focus/focus-stats";
import { FocusTimer } from "@/components/focus/focus-timer";
import { LogFocusForm } from "@/components/focus/log-focus-form";
import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";

export default async function FocusPage() {
  const [sessions, stats, tasks] = await Promise.all([
    getRecentFocusSessions(20),
    getFocusOverviewStats(),
    getFocusLinkableTasks(),
  ]);

  return (
    <>
      <Header title="Focus" description="Timer, sound, one session" />
      <AppPageFrame className="max-w-6xl gap-8 md:py-10">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18.5rem,22rem)] lg:gap-8">
          <FocusTimer tasks={tasks} />

          <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20">
            <FocusStats stats={stats} />
            <FocusSounds />
            <LogFocusForm tasks={tasks} />
          </aside>
        </div>

        <FocusSessionList sessions={sessions} />
      </AppPageFrame>
    </>
  );
}
