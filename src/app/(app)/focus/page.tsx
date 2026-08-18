import {
  getRecentFocusSessions,
  getTodayFocusStats,
} from "@/actions/focus";
import { FocusPageFrame, FocusWorkspace } from "@/components/focus/focus-page-frame";
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
        <FocusWorkspace
          stage={<FocusTimer />}
          rail={
            <>
              <FocusStats
                sessions={stats.sessions}
                focusMinutes={stats.focus_minutes}
              />
              <FocusSounds />
              <LogFocusForm />
            </>
          }
        />
        <FocusSessionList sessions={sessions} />
      </FocusPageFrame>
    </>
  );
}
