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

  useEffect(() => {
    setPhase(dashboardPhaseFromHour(new Date().getHours()));
  }, []);

  return (
    <div className="dash-page-atmosphere" data-phase={phase}>
      <div className="dash-page-wash" aria-hidden="true" />
      <div className="dash-page-grain" aria-hidden="true" />
      <div className="dash-page-content">{children}</div>
    </div>
  );
}
