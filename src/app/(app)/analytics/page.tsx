import { getAnalyticsData } from "@/actions/analytics";
import {
  HabitCompletionChart,
  MoodEnergyChart,
  ProductivityChart,
} from "@/components/analytics/analytics-charts";
import { AnalyticsSummaryCards } from "@/components/analytics/analytics-summary";
import { HabitStreaksList } from "@/components/analytics/habit-streaks-list";
import { Header } from "@/components/layout/header";

export default async function AnalyticsPage() {
  const data = await getAnalyticsData(30);

  return (
    <>
      <Header
        title="Analytics"
        description="Streaks and productivity over the last 30 days"
      />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <AnalyticsSummaryCards
          summary={data.summary}
          rangeDays={data.range_days}
        />

        <div className="grid gap-6 xl:grid-cols-5">
          <div className="space-y-6 xl:col-span-3">
            <ProductivityChart series={data.series} />
            <HabitCompletionChart series={data.series} />
            <MoodEnergyChart series={data.series} />
          </div>
          <div className="xl:col-span-2">
            <HabitStreaksList streaks={data.habit_streaks} />
          </div>
        </div>
      </div>
    </>
  );
}
