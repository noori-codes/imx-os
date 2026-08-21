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
      <AppPageFrame>
        <FocusTimer tasks={tasks} />
        <FocusStats stats={stats} />
        <FocusSounds />
        <LogFocusForm tasks={tasks} />
        <FocusSessionList sessions={sessions} />
      </AppPageFrame>
    </>
  );
}
