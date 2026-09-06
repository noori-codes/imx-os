"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import {
  dashboardPhaseFromHour,
  type DashboardPhase,
} from "@/lib/dashboard-phase";

type DashboardAtmosphereProps = {
  children: ReactNode;
};

export function DashboardAtmosphere({ children }: DashboardAtmosphereProps) {
  const [phase, setPhase] = useState<DashboardPhase>("afternoon");
  const [grainReady, setGrainReady] = useState(false);

  useEffect(() => {
    setPhase(dashboardPhaseFromHour(new Date().getHours()));
  }, []);

  // Defer expensive SVG noise until after first paint / idle.
  useEffect(() => {
    let cancelled = false;
    const enable = () => {
      if (!cancelled) setGrainReady(true);
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(enable, { timeout: 1200 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }

    const timer = window.setTimeout(enable, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="dash-page-atmosphere" data-phase={phase}>
      <div className="dash-page-wash" aria-hidden="true" />
      {grainReady ? (
        <div className="dash-page-grain" aria-hidden="true" />
      ) : null}
      <div className="dash-page-content">{children}</div>
    </div>
  );
}
