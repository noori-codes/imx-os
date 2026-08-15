import Link from "next/link";

import { getDashboardData } from "@/actions/dashboard";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";
import { GoalProgressList } from "@/components/dashboard/goal-progress-list";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { StatGrid } from "@/components/dashboard/stat-cards";
import { TodayFocus } from "@/components/dashboard/today-focus";
import { WeekOverview } from "@/components/dashboard/week-overview";

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

export default async function DashboardPage() {
  const [user, data] = await Promise.all([
    getCurrentUser(),
    getDashboardData(),
  ]);
  const name = user?.email?.split("@")[0] ?? "there";

  return (
    <>
      <Header title="Dashboard" description={formatToday()} />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-[1.75rem]">
              {getGreeting()}, {name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.stats.due_today > 0 || data.stats.overdue > 0
                ? `${data.stats.due_today + data.stats.overdue} item${
                    data.stats.due_today + data.stats.overdue === 1 ? "" : "s"
                  } need attention today.`
                : "You're clear for today — nice work."}
            </p>
          </div>
        </div>

        <StatGrid stats={data.stats} />

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <TodayFocus tasks={data.today_tasks} />
            <WeekOverview week={data.week} />
          </div>

          <div className="space-y-6 lg:col-span-2">
            <QuickActions />
            <GoalProgressList goals={data.goals} />
          </div>
        </div>

        <ActivityHeatmap activity={data.activity} />

        {data.stats.active_tasks === 0 && data.stats.goals === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Get started by{" "}
            <Link href="/tasks" className="text-primary hover:underline">
              adding a task
            </Link>{" "}
            or{" "}
            <Link href="/goals" className="text-primary hover:underline">
              creating a goal
            </Link>
            .
          </div>
        ) : null}
      </div>
    </>
  );
}
