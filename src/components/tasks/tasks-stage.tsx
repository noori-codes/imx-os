import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type TasksStageProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Full-bleed tasks desk — same edge-to-edge rhythm as the dashboard.
 * Spans the main column from sidebar edge to scrollbar.
 */
export function TasksStage({ children, className }: TasksStageProps) {
  return (
    <div
      className={cn(
        "tasks-page-frame flex w-full min-w-0 max-w-none flex-1 flex-col",
        "px-4 pt-4 pb-[calc(1.25rem+var(--mobile-tab-h))] sm:px-5",
        "md:px-6 md:pt-5 md:pb-8",
        "lg:px-8 lg:pt-6 lg:pb-10",
        className,
      )}
    >
      <div className="tasks-stage">
        <div className="tasks-stage-wash" aria-hidden="true" />
        <div className="tasks-stage-glow" aria-hidden="true" />
        <div className="tasks-stage-glow-soft" aria-hidden="true" />
        <div className="tasks-stage-content">{children}</div>
      </div>
    </div>
  );
}
