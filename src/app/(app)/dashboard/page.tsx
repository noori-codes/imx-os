import Link from "next/link";
import {
  ListTodo,
  Moon,
  NotebookPen,
  Plus,
  Target,
  Timer,
} from "lucide-react";

import { getDashboardData } from "@/actions/dashboard";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";
import { FocusToday } from "@/components/dashboard/focus-today";
import { GoalProgressList } from "@/components/dashboard/goal-progress-list";
import { HabitsToday } from "@/components/dashboard/habits-today";
import { NextSteps } from "@/components/dashboard/next-steps";
import { OnboardingCard } from "@/components/dashboard/onboarding-card";
import { MetricStrip } from "@/components/dashboard/stat-cards";
import { StreaksBoard } from "@/components/dashboard/streaks-board";
import { TodayFocus } from "@/components/dashboard/today-focus";
import { WeekOverview } from "@/components/dashboard/week-overview";
import { Button } from "@/components/ui/button";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatToday() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
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
  const showNextSteps = data.today_tasks.length === 0 || data.is_new_user;

  return (
    <>
      <Header title="Dashboard" description={formatToday()} />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-sm text-muted-foreground">{formatToday()}</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">
              {getGreeting()}, {name}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {data.review.intent
                ? data.review.intent
                : attention > 0
                  ? `${attention} item${attention === 1 ? "" : "s"} need attention today.`
                  : "You're clear for today — nice work."}
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
              <Link href="/goals">
                <Target className="size-3.5" />
                Goal
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/focus">
                <Timer className="size-3.5" />
                Focus
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/notes">
                <NotebookPen className="size-3.5" />
                Notes
              </Link>
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

        <MetricStrip stats={data.stats} />

        <StreaksBoard
          activity={data.activity}
          habits={data.habits_today}
        />

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(16rem,0.95fr)] lg:gap-14">
          <div className="space-y-10">
            <TodayFocus tasks={data.today_tasks} />
            <NextSteps steps={data.next_steps} show={showNextSteps} />
            <WeekOverview week={data.week} />
          </div>

          <aside className="space-y-10 lg:border-l lg:border-border/60 lg:pl-10">
            <HabitsToday habits={data.habits_today} />
            <FocusToday
              sessions={data.focus_today.sessions}
              focusMinutes={data.focus_today.focus_minutes}
            />
            <GoalProgressList goals={data.goals} />
            {!data.is_new_user ? (
              <div className="flex flex-wrap gap-2 pt-2">
                <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                  <Link href="/tasks">
                    <ListTodo className="size-3.5" />
                    All tasks
                  </Link>
                </Button>
              </div>
            ) : null}
          </aside>
        </div>

        <ActivityHeatmap activity={data.activity} />
      </div>
    </>
  );
}
