import { getDashboardData } from "@/actions/dashboard";
import { getCurrentUser } from "@/lib/auth";
import { DashboardStage } from "@/components/dashboard/dashboard-stage";
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
        <DashboardStage
          name={name}
          greeting={getGreeting()}
          data={data}
        />
      </AppPageFrame>
    </>
  );
}
