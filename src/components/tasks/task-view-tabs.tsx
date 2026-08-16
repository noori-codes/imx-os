import Link from "next/link";

import { cn } from "@/lib/utils";
import { TASK_VIEWS, type TaskView } from "@/types/task";

type TaskViewTabsProps = {
  active: TaskView;
  counts: Record<TaskView, number>;
};

export function TaskViewTabs({ active, counts }: TaskViewTabsProps) {
  return (
    <nav
      className="flex gap-1 overflow-x-auto border-b border-border/60"
      aria-label="Task views"
    >
      {TASK_VIEWS.map((view) => {
        const isActive = active === view.id;
        const count = counts[view.id];
        return (
          <Link
            key={view.id}
            href={view.id === "inbox" ? "/tasks" : `/tasks?view=${view.id}`}
            className={cn(
              "relative shrink-0 px-3 py-2.5 text-sm transition-colors",
              isActive
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {view.label}
            {count > 0 ? (
              <span
                className={cn(
                  "ml-1.5 tabular-nums",
                  isActive ? "text-muted-foreground" : "text-muted-foreground/80",
                )}
              >
                {count}
              </span>
            ) : null}
            {isActive ? (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-foreground" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
