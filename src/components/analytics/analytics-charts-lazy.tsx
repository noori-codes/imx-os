"use client";

import dynamic from "next/dynamic";

import { AnalyticsChartChunkFallback } from "@/components/analytics/analytics-chart-fallback";

/** Client-side dynamic imports so recharts actually code-splits. */
export const FocusMinutesChartLazy = dynamic(
  () =>
    import("@/components/analytics/analytics-charts").then((m) => ({
      default: m.FocusMinutesChart,
    })),
  { loading: () => <AnalyticsChartChunkFallback label="Loading focus chart" /> },
);

export const HabitCompletionChartLazy = dynamic(
  () =>
    import("@/components/analytics/analytics-charts").then((m) => ({
      default: m.HabitCompletionChart,
    })),
  {
    loading: () => (
      <AnalyticsChartChunkFallback label="Loading habits chart" />
    ),
  },
);

export const MoodEnergyChartLazy = dynamic(
  () =>
    import("@/components/analytics/analytics-charts").then((m) => ({
      default: m.MoodEnergyChart,
    })),
  {
    loading: () => (
      <AnalyticsChartChunkFallback label="Loading mood chart" />
    ),
  },
);
