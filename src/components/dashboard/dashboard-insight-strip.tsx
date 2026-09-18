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

const pillPrimary =
  "inline-flex h-8 items-center rounded-lg bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90";
const pillOutline =
  "inline-flex h-8 items-center rounded-lg border border-surface-border bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:border-border";

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
    <div className="dash-insight-strip border-t border-border/30 pt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
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

        <div className="flex flex-wrap items-center gap-2">
          {empty ? (
            <>
              <Link href="/focus" className={pillPrimary}>
                Open Focus
              </Link>
              <Link href="/habits" className={pillOutline}>
                Habits
              </Link>
              <Link href="/review" className={pillOutline}>
                Review
              </Link>
            </>
          ) : (
            <>
              {habitsTotal > 0 && habitsDone === 0 ? (
                <Link href="/habits" className={pillOutline}>
                  Habits
                </Link>
              ) : focusMinutes === 0 ? (
                <Link href="/focus" className={pillOutline}>
                  Focus
                </Link>
              ) : null}
              <Link href="/analytics" className={pillOutline}>
                Analytics →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
