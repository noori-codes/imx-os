"use client";

import type { ReactNode } from "react";

type DashboardAtmosphereProps = {
  children: ReactNode;
};

/** Light command-center shell — structure first, atmosphere second. */
export function DashboardAtmosphere({ children }: DashboardAtmosphereProps) {
  return (
    <div className="dash-page-atmosphere">
      <div className="dash-page-wash" aria-hidden="true" />
      <div className="dash-page-content">{children}</div>
    </div>
  );
}
