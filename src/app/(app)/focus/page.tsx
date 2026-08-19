import {
  getRecentFocusSessions,
  getTodayFocusStats,
} from "@/actions/focus";
import { FocusPageFrame } from "@/components/focus/focus-page-frame";
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
      <FocusPageFrame>
        <div className="mx-auto w-full max-w-4xl">
          <FocusTimer />
        </div>

        <div className="mx-auto w-full max-w-4xl">
          <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
            <div className="grid gap-4 lg:auto-rows-fr">
              <FocusStats
                sessions={stats.sessions}
                focusMinutes={stats.focus_minutes}
              />
              <LogFocusForm />
            </div>

            <div className="h-full">
              <FocusSounds />
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-4xl">
          <FocusSessionList sessions={sessions} />
        </div>
      </FocusPageFrame>
    </>
  );
}
