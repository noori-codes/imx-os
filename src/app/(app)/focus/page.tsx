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
import { AppPageFrame } from "@/components/shared/app-page-frame";

export default async function FocusPage() {
  const [sessions, stats] = await Promise.all([
    getRecentFocusSessions(20),
    getTodayFocusStats(),
  ]);

  return (
    <>
      <Header title="Focus" description="Timer, sound, one session" />
      <AppPageFrame>
        <FocusTimer />
        <FocusStats
          sessions={stats.sessions}
          focusMinutes={stats.focus_minutes}
        />
        <FocusSounds />
        <LogFocusForm />
        <FocusSessionList sessions={sessions} />
      </AppPageFrame>
    </>
  );
}
