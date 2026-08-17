import {
  getRecentFocusSessions,
  getTodayFocusStats,
} from "@/actions/focus";
import { FocusSessionList } from "@/components/focus/focus-session-list";
import { FocusStats } from "@/components/focus/focus-stats";
import { FocusTimer } from "@/components/focus/focus-timer";
import { LogFocusForm } from "@/components/focus/log-focus-form";
import { Header } from "@/components/layout/header";

export default async function FocusPage() {
  const [sessions, stats] = await Promise.all([
    getRecentFocusSessions(20),
    getTodayFocusStats(),
  ]);

  return (
    <>
      <Header title="Focus" description="One session at a time" />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-6 md:px-8 md:py-8">
        <FocusStats
          sessions={stats.sessions}
          focusMinutes={stats.focus_minutes}
        />
        <FocusTimer />
        <LogFocusForm />
        <FocusSessionList sessions={sessions} />
      </div>
    </>
  );
}
