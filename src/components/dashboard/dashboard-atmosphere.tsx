"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DashboardAtmosphereProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Full-bleed graphite desk — soft top fade, no max-width.
 * Spans main column from sidebar edge to scrollbar.
 */
export function DashboardAtmosphere({
  children,
  className,
}: DashboardAtmosphereProps) {
  return (
    <div
      className={cn(
        "dash-page-frame flex w-full min-w-0 max-w-none flex-1 flex-col",
        "px-4 pt-4 pb-[calc(1.25rem+var(--mobile-tab-h))] sm:px-5",
        "md:px-6 md:pt-5 md:pb-8",
        "lg:px-8 lg:pt-6 lg:pb-10",
        className,
      )}
    >
      <div className="dash-page-atmosphere">
        <div className="dash-page-wash" aria-hidden="true" />
        <div className="dash-page-content">{children}</div>
      </div>
    </div>
  );
}
