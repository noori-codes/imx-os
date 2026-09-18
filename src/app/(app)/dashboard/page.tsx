import { Suspense } from "react";
import type { Metadata } from "next";

import { getDashboardData } from "@/actions/dashboard";
import { getCurrentUser } from "@/lib/auth";
import { resolveGreetingName } from "@/lib/display-name";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { DashboardStage } from "@/components/dashboard/dashboard-stage";
import { Header } from "@/components/layout/header";
import { AppPageFrame } from "@/components/shared/app-page-frame";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Today’s overview across tasks, habits, and focus",
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

async function DashboardBody() {
  const [user, data] = await Promise.all([
    getCurrentUser(),
    getDashboardData(),
  ]);
  const name = user ? resolveGreetingName(user) : "there";

  return (
    <AppPageFrame className="max-w-6xl gap-8 md:py-8">
      <DashboardStage name={name} greeting={getGreeting()} data={data} />
    </AppPageFrame>
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
