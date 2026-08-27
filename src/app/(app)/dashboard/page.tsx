import Link from "next/link";

import { getDashboardData } from "@/actions/dashboard";
import { getCurrentUser } from "@/lib/auth";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { GoalProgressList } from "@/components/dashboard/goal-progress-list";
import { HabitsToday } from "@/components/dashboard/habits-today";
import { TodayFocus } from "@/components/dashboard/today-focus";
import { WeekOverview } from "@/components/dashboard/week-overview";
import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function displayName(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}) {
  const meta = user.user_metadata ?? {};
  const full =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    null;
  if (full?.trim()) return full.trim().split(/\s+/)[0];
  return user.email?.split("@")[0] ?? "there";
}

export default async function DashboardPage() {
  const [user, data] = await Promise.all([
    getCurrentUser(),
    getDashboardData(),
  ]);
  const name = user ? displayName(user) : "there";

  return (
    <>
      <Header title="Dashboard" />
      <AppPageFrame className="max-w-5xl gap-10 md:py-8">
        <DashboardHero
          name={name}
          greeting={getGreeting()}
          intent={data.review.intent}
          dueToday={data.stats.due_today}
          overdue={data.stats.overdue}
          focusMinutes={data.stats.focus_minutes_today}
          habitsDone={data.stats.habits_done}
          habitsTotal={data.stats.habits_total}
          streak={data.stats.activity_streak}
        />

        <div className="dash-quad grid grid-cols-1 border-t border-border/30 lg:grid-cols-2 lg:grid-rows-[1fr_1fr]">
          <div className="dash-quad-cell border-b border-border/30 lg:border-r">
            <TodayFocus tasks={data.today_tasks} />
          </div>
          <div className="dash-quad-cell border-b border-border/30">
            <HabitsToday habits={data.habits_today} />
          </div>
          <div className="dash-quad-cell border-b border-border/30 lg:border-r lg:border-b-0">
            <WeekOverview week={data.week} />
          </div>
          <div className="dash-quad-cell border-b border-border/30 lg:border-b-0">
            <GoalProgressList goals={data.goals} />
          </div>
        </div>

        <div className="flex justify-end">
          <Link
            href="/analytics"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {data.stats.activity_streak > 0
              ? `${data.stats.activity_streak}d · Analytics`
              : "Analytics"}
          </Link>
        </div>
      </AppPageFrame>
    </>
  );
}
