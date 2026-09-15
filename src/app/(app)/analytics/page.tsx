import { Suspense } from "react";
import type { Metadata } from "next";

import {
  getAnalyticsCore,
  getAnalyticsHabitStreaks,
} from "@/actions/analytics";
import {
  FocusMinutesChartLazy,
  HabitCompletionChartLazy,
  MoodEnergyChartLazy,
} from "@/components/analytics/analytics-charts-lazy";
import { AnalyticsHero } from "@/components/analytics/analytics-hero";
import { AnalyticsSkeleton } from "@/components/analytics/analytics-skeleton";
import { AnalyticsStage } from "@/components/analytics/analytics-stage";
import { HabitStreaksList } from "@/components/analytics/habit-streaks-list";
import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { cn } from "@/lib/utils";
import {
  parseAnalyticsRange,
  type AnalyticsRangeDays,
} from "@/types/analytics";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Focus, habits, and mood patterns over time",
};

type AnalyticsPageProps = {
  searchParams: Promise<{ range?: string }>;
};

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn("imx-skeleton-bone", className)} aria-hidden="true" />
  );
}

function HabitStreaksFallback() {
  return (
    <div
      className="imx-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading habit streaks"
    >
      <Bone className="h-2.5 w-14" />
      <Bone className="mt-2 h-4 w-36 opacity-60" />
      <div className="mt-5 space-y-0 divide-y divide-border/40">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 py-3"
          >
            <div className="flex items-center gap-2.5">
              <Bone className="size-2 rounded-full" />
              <div className="space-y-1.5">
                <Bone className="h-3.5 w-24" />
                <Bone className="h-2.5 w-20 opacity-60" />
              </div>
            </div>
            <div className="space-y-1.5 text-right">
              <Bone className="ml-auto h-3.5 w-8" />
              <Bone className="ml-auto h-2.5 w-12 opacity-60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function AnalyticsStreaksBody({
  rangeDays,
}: {
  rangeDays: AnalyticsRangeDays;
}) {
  const streaks = await getAnalyticsHabitStreaks(rangeDays);
  return <HabitStreaksList streaks={streaks} rangeDays={rangeDays} />;
}

async function AnalyticsCoreBody({
  rangeDays,
}: {
  rangeDays: AnalyticsRangeDays;
}) {
  const data = await getAnalyticsCore(rangeDays);
  const { summary } = data;

  return (
    <AppPageFrame className="max-w-5xl gap-10 md:py-8">
      <AnalyticsStage>
        <div className="analytics-reveal">
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
        </div>

        <div className="analytics-reveal analytics-reveal-delay-1 border-t border-border/30 pt-8">
          <FocusMinutesChartLazy
            series={data.series}
            goalMinutes={summary.daily_focus_goal_minutes}
          />
        </div>

        <div className="analytics-reveal analytics-reveal-delay-2 grid gap-10 border-t border-border/30 pt-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
          <HabitCompletionChartLazy series={data.series} />
          <Suspense fallback={<HabitStreaksFallback />}>
            <AnalyticsStreaksBody rangeDays={rangeDays} />
          </Suspense>
        </div>

        <div className="analytics-reveal analytics-reveal-delay-3 border-t border-border/30 pt-8">
          <MoodEnergyChartLazy series={data.series} />
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
      </AnalyticsStage>
    </AppPageFrame>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const { range } = await searchParams;
  const rangeDays = parseAnalyticsRange(range);

  return (
    <>
      <Header
        chrome
        title="Analytics"
        description={`Patterns over the last ${rangeDays} days`}
      />
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsCoreBody rangeDays={rangeDays} />
      </Suspense>
    </>
  );
}
