import Link from "next/link";

import { cn } from "@/lib/utils";
import { TASK_VIEWS, type TaskView } from "@/types/task";

type TasksViewTabsProps = {
  active: TaskView;
  counts: Record<TaskView, number>;
};

function viewHref(view: TaskView) {
  return view === "today" ? "/tasks" : `/tasks?view=${view}`;
}

export function TasksViewTabs({ active, counts }: TasksViewTabsProps) {
  return (
    <nav className="flex flex-wrap gap-1.5" aria-label="Task views">
      {TASK_VIEWS.map((tab) => {
        const isActive = active === tab.id;
        const count = counts[tab.id];
        return (
          <Link
            key={tab.id}
            href={viewHref(tab.id)}
            scroll={false}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-foreground text-background"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
            {count > 0 ? (
              <span
                className={cn(
                  "ml-1.5 tabular-nums",
                  isActive ? "text-background/70" : "text-muted-foreground",
                )}
              >
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
