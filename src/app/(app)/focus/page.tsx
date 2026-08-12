import {
  getRecentFocusSessions,
  getTodayFocusStats,
} from "@/actions/focus";
import { FocusSessionList } from "@/components/focus/focus-session-list";
import { FocusStats } from "@/components/focus/focus-stats";
import { FocusTimer } from "@/components/focus/focus-timer";
import { Header } from "@/components/layout/header";

export default async function FocusPage() {
  const [sessions, stats] = await Promise.all([
    getRecentFocusSessions(12),
    getTodayFocusStats(),
  ]);

  return (
    <>
      <Header title="Focus" description="Pomodoro and focus sessions" />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <FocusStats
          sessions={stats.sessions}
          focusMinutes={stats.focus_minutes}
        />

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <FocusTimer />
          </div>
          <div className="lg:col-span-2">
            <FocusSessionList sessions={sessions} />
          </div>
        </div>
      </div>
    </>
  );
}
