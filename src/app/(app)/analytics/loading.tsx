import { AnalyticsSkeleton } from "@/components/analytics/analytics-skeleton";
import { Header } from "@/components/layout/header";

export default function AnalyticsLoading() {
  return (
    <>
      <Header chrome title="Analytics" description="Patterns over time" />
      <AnalyticsSkeleton />
    </>
  );
}
