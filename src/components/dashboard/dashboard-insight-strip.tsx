import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { formatFocusMinutes } from "@/types/focus";

type DashboardInsightStripProps = {
  focusMinutes: number;
  tasksDoneToday: number;
  habitsDone: number;
  habitsTotal: number;
  streak: number;
  activeDaysWeek: number;
};

function InsightItem({
  children,
  muted,
  highlight,
}: {
  children: ReactNode;
  muted?: boolean;
  highlight?: boolean;
}) {
  return (
    <span
      className={cn(
        "tabular-nums tracking-wide",
        highlight
          ? "font-medium text-amber-700 dark:text-amber-400"
          : muted
            ? "text-muted-foreground/70"
            : "text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

export function DashboardInsightStrip({
  focusMinutes,
  tasksDoneToday,
  habitsDone,
  habitsTotal,
  streak,
  activeDaysWeek,
}: DashboardInsightStripProps) {
  const items: ReactNode[] = [];

  if (focusMinutes > 0) {
    items.push(
      <InsightItem key="focus">
        {formatFocusMinutes(focusMinutes)} focus today
      </InsightItem>,
    );
  }

  if (tasksDoneToday > 0) {
    items.push(
      <InsightItem key="tasks">
        {tasksDoneToday} task{tasksDoneToday === 1 ? "" : "s"} done
      </InsightItem>,
    );
  }

  if (habitsTotal > 0) {
    items.push(
      <InsightItem key="habits" muted={habitsDone === 0}>
        {habitsDone}/{habitsTotal} habits
      </InsightItem>,
    );
  }

  if (streak >= 14) {
    items.push(
      <InsightItem key="streak-milestone" highlight>
        {streak} days strong
      </InsightItem>,
    );
  }

  if (activeDaysWeek > 0 && items.length < 3) {
    items.push(
      <InsightItem key="active" muted>
        {activeDaysWeek} active day{activeDaysWeek === 1 ? "" : "s"} this week
      </InsightItem>,
    );
  }

  const empty = items.length === 0;

  return (
    <Link
      href="/analytics"
      className="dash-insight-strip group block rounded-2xl border px-5 py-4 transition-colors hover:border-border/55 hover:bg-card/55 sm:px-6"
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
            This week
          </p>
          <p className="mt-1.5 text-xs leading-relaxed">
            {empty ? (
              <span className="text-muted-foreground">
                Quiet so far · room to begin
              </span>
            ) : (
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {items.map((item, index) => (
                  <span key={index} className="inline-flex items-center gap-2">
                    {index > 0 ? (
                      <span
                        className="text-muted-foreground/30"
                        aria-hidden="true"
                      >
                        ·
                      </span>
                    ) : null}
                    {item}
                  </span>
                ))}
              </span>
            )}
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium tracking-wide text-muted-foreground transition-colors group-hover:text-foreground">
          Analytics →
        </span>
      </div>
    </Link>
  );
}
