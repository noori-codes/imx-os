import { Header } from "@/components/layout/header";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

export default function DashboardLoading() {
  return (
    <>
      <Header title="Dashboard" />
      <DashboardSkeleton />
    </>
  );
}
