import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AppPageFrameProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Full-bleed app desk — same edge-to-edge rhythm as dashboard / tasks / focus.
 * Spans the main column from sidebar edge to scrollbar.
 */
export function AppPageFrame({ children, className }: AppPageFrameProps) {
  return (
    <div
      className={cn(
        "imx-page-atmosphere flex w-full min-w-0 max-w-none flex-1 flex-col gap-7",
        "px-4 pt-4 pb-[calc(1.25rem+var(--mobile-tab-h))] sm:px-5",
        "md:gap-8 md:px-6 md:pt-5 md:pb-8",
        "lg:px-8 lg:pt-6 lg:pb-10",
        className,
      )}
    >
      {children}
    </div>
  );
}
