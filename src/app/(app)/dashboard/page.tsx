import { getDashboardData } from "@/actions/dashboard";
import { getCurrentUser } from "@/lib/auth";
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { GoalProgressList } from "@/components/dashboard/goal-progress-list";
import { HabitsToday } from "@/components/dashboard/habits-today";
import { NextSteps } from "@/components/dashboard/next-steps";
import { OnboardingCard } from "@/components/dashboard/onboarding-card";
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
      <Header title="Dashboard" description="What needs you today" />
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

        {data.is_new_user ? <OnboardingCard /> : null}

        <div className="grid items-start gap-10 border-t border-border/30 pt-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
          <TodayFocus tasks={data.today_tasks} />
          <HabitsToday habits={data.habits_today} />
        </div>

        {data.is_new_user ? (
          <NextSteps steps={data.next_steps} show />
        ) : null}

        <div className="grid items-start gap-8 border-t border-border/30 pt-8 lg:grid-cols-2 lg:gap-10">
          <WeekOverview week={data.week} />
          <GoalProgressList goals={data.goals} />
        </div>

        <div className="border-t border-border/30 pt-8">
          <ActivityHeatmap activity={data.activity} />
        </div>
      </AppPageFrame>
    </>
  );
}
