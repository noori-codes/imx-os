import { Suspense } from "react";
import type { Metadata } from "next";

import { getDashboardData } from "@/actions/dashboard";
import { getCurrentUser } from "@/lib/auth";
import { resolveGreetingName } from "@/lib/display-name";
import { getHourInZone, getRequestTimeZone } from "@/lib/timezone";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { DashboardStage } from "@/components/dashboard/dashboard-stage";
import { Header } from "@/components/layout/header";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Today’s overview across tasks, habits, and focus",
};

async function getGreeting() {
  const timeZone = await getRequestTimeZone();
  const hour = timeZone
    ? getHourInZone(new Date(), timeZone)
    : new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

async function DashboardBody() {
  // Goal + freezes ride on getDashboardData (one Auth path) — no parallel
  // getDailyFocusGoal / getUserSettings stampedes.
  const [user, data, greeting] = await Promise.all([
    getCurrentUser(),
    getDashboardData(),
    getGreeting(),
  ]);
  const name = user ? resolveGreetingName(user) : "there";

  return (
    <DashboardStage
      name={name}
      greeting={greeting}
      data={data}
      focusGoalMinutes={data.daily_focus_goal_minutes}
      streakFreezesRemaining={data.streak_freezes_remaining}
    />
  );
}

export default function DashboardPage() {
  return (
    <>
      <Header chrome title="Dashboard" />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardBody />
      </Suspense>
    </>
  );
}
