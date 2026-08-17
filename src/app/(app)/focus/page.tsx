import {
  getRecentFocusSessions,
  getTodayFocusStats,
} from "@/actions/focus";
import { FocusSessionList } from "@/components/focus/focus-session-list";
import { FocusSounds } from "@/components/focus/focus-sounds";
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
      <Header title="Focus" description="Timer, sound, one session" />
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-6 md:px-8 md:py-8">
        <FocusStats
          sessions={stats.sessions}
          focusMinutes={stats.focus_minutes}
        />

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19.5rem]">
          <FocusTimer />
          <FocusSounds />
        </div>

        <div className="mx-auto w-full max-w-3xl space-y-8">
          <LogFocusForm />
          <FocusSessionList sessions={sessions} />
        </div>
      </div>
    </>
  );
}
