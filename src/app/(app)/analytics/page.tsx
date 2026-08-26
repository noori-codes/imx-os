import { getAnalyticsData } from "@/actions/analytics";
import {
  FocusMinutesChart,
  HabitCompletionChart,
  MoodEnergyChart,
} from "@/components/analytics/analytics-charts";
import { AnalyticsHero } from "@/components/analytics/analytics-hero";
import { HabitStreaksList } from "@/components/analytics/habit-streaks-list";
import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { parseAnalyticsRange } from "@/types/analytics";

type AnalyticsPageProps = {
  searchParams: Promise<{ range?: string }>;
};

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const { range } = await searchParams;
  const rangeDays = parseAnalyticsRange(range);
  const data = await getAnalyticsData(rangeDays);
  const { summary } = data;

  return (
    <>
      <Header
        title="Analytics"
        description={`Patterns over the last ${rangeDays} days`}
      />
      <AppPageFrame className="max-w-5xl gap-10 md:py-8">
        <AnalyticsHero
          rangeDays={rangeDays}
          focusMinutes={summary.focus_minutes}
          habitsAvgRate={summary.habits_avg_rate}
          bestHabitStreak={summary.best_habit_streak}
          focusGoalHitDays={summary.focus_goal_hit_days}
          focusGoalDays={summary.focus_goal_days}
          focusSessions={summary.focus_sessions}
          tasksCompleted={summary.tasks_completed}
          dailyFocusGoalMinutes={summary.daily_focus_goal_minutes}
        />

        <div className="border-t border-border/30 pt-8">
          <FocusMinutesChart
            series={data.series}
            goalMinutes={summary.daily_focus_goal_minutes}
          />
        </div>

        <div className="grid gap-10 border-t border-border/30 pt-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
          <HabitCompletionChart series={data.series} />
          <HabitStreaksList
            streaks={data.habit_streaks}
            rangeDays={rangeDays}
          />
        </div>

        <div className="border-t border-border/30 pt-8">
          <MoodEnergyChart series={data.series} />
          {summary.avg_mood !== null || summary.avg_energy !== null ? (
            <p className="mt-4 text-center text-xs tabular-nums text-muted-foreground sm:text-left">
              Avg mood {summary.avg_mood ?? "—"} · energy{" "}
              {summary.avg_energy ?? "—"}
              {summary.reviews_logged > 0
                ? ` · ${summary.reviews_logged} review${summary.reviews_logged === 1 ? "" : "s"}`
                : ""}
            </p>
          ) : null}
        </div>
      </AppPageFrame>
    </>
  );
}
