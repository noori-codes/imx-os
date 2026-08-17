import Link from "next/link";
import { Moon, Plus, Timer } from "lucide-react";

import { getDashboardData } from "@/actions/dashboard";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";
import { DashboardChrome } from "@/components/dashboard/dashboard-chrome";
import { GoalProgressList } from "@/components/dashboard/goal-progress-list";
import { HabitsToday } from "@/components/dashboard/habits-today";
import { NextSteps } from "@/components/dashboard/next-steps";
import { OnboardingCard } from "@/components/dashboard/onboarding-card";
import { TodayFocus } from "@/components/dashboard/today-focus";
import { WeekOverview } from "@/components/dashboard/week-overview";
import { FocusEntryLink } from "@/components/focus/focus-entry-link";
import { Button } from "@/components/ui/button";

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
  const attention = data.stats.due_today + data.stats.overdue;

  return (
    <>
      <Header title="Dashboard" />
      <DashboardChrome
        status={{
          dueToday: data.stats.due_today,
          overdue: data.stats.overdue,
          streak: data.stats.activity_streak,
          focusMinutes: data.stats.focus_minutes_today,
          habitsDone: data.stats.habits_done,
          habitsTotal: data.stats.habits_total,
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight">
              {getGreeting()}, {name}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {data.review.intent
                ? data.review.intent
                : attention > 0
                  ? `${attention} item${attention === 1 ? "" : "s"} need attention.`
                  : "You're clear — nice work."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/tasks">
                <Plus className="size-3.5" />
                Task
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <FocusEntryLink>
                <Timer className="size-3.5" />
                Focus
              </FocusEntryLink>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/review">
                <Moon className="size-3.5" />
                Review
              </Link>
            </Button>
          </div>
        </div>

        {data.is_new_user ? <OnboardingCard /> : null}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(14rem,0.85fr)] lg:gap-14">
          <TodayFocus tasks={data.today_tasks} />
          <HabitsToday habits={data.habits_today} />
        </div>

        {data.is_new_user ? (
          <NextSteps steps={data.next_steps} show />
        ) : null}

        <WeekOverview week={data.week} />

        <GoalProgressList goals={data.goals} />

        <ActivityHeatmap activity={data.activity} />
      </DashboardChrome>
    </>
  );
}
