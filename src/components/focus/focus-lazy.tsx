"use client";

import dynamic from "next/dynamic";

import {
  FocusStatsChunkFallback,
  FocusTimerChunkFallback,
} from "@/components/focus/focus-chunk-fallbacks";

/** Client-side dynamic import so the timer chunk actually splits. */
export const FocusTimerLazy = dynamic(
  () =>
    import("@/components/focus/focus-timer").then((m) => ({
      default: m.FocusTimer,
    })),
  { loading: () => <FocusTimerChunkFallback /> },
);

export const FocusStatsLazy = dynamic(
  () =>
    import("@/components/focus/focus-stats").then((m) => ({
      default: m.FocusStats,
    })),
  { loading: () => <FocusStatsChunkFallback /> },
);
