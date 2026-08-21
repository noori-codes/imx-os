import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AppPageFrameProps = {
  children: ReactNode;
  className?: string;
};

/** Brand page shell — matches Habits width and rhythm. */
export function AppPageFrame({ children, className }: AppPageFrameProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
