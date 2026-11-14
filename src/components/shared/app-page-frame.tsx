import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AppPageFrameProps = {
  children: ReactNode;
  className?: string;
};

/** Brand page shell — quiet graphite room rhythm. */
export function AppPageFrame({ children, className }: AppPageFrameProps) {
  return (
    <div
      className={cn(
        "imx-page-atmosphere mx-auto flex w-full max-w-3xl flex-1 flex-col gap-7 px-4 pt-5 pb-[calc(1.5rem+var(--mobile-tab-h))] md:gap-8 md:px-8 md:pt-7 md:pb-9",
        className,
      )}
    >
      {children}
    </div>
  );
}
