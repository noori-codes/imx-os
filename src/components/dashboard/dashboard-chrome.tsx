"use client";

import Link from "next/link";
import { Flame, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatFocusMinutes } from "@/types/focus";

type StickyStatusProps = {
  dueToday: number;
  overdue: number;
  streak: number;
  focusMinutes: number;
  habitsDone: number;
  habitsTotal: number;
};

export function DashboardChrome({
  status,
  children,
}: {
  status: StickyStatusProps;
  children: React.ReactNode;
}) {
  const attention = status.dueToday + status.overdue;

  return (
    <>
      <div className="sticky top-14 z-[9] border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-11 max-w-6xl items-center justify-between gap-3 px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-4 text-sm">
            <span
              className={cn(
                "tabular-nums",
                attention > 0
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {attention > 0 ? `${attention} due` : "Clear today"}
            </span>
            <span className="hidden h-3 w-px bg-border sm:block" />
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Flame
                className={cn(
                  "size-3.5",
                  status.streak > 0
                    ? "fill-amber-500 text-amber-500"
                    : "opacity-50",
                )}
              />
              <span className="tabular-nums">{status.streak}d</span>
            </span>
            {status.habitsTotal > 0 ? (
              <>
                <span className="hidden h-3 w-px bg-border sm:block" />
                <span className="hidden text-muted-foreground tabular-nums sm:inline">
                  Habits {status.habitsDone}/{status.habitsTotal}
                </span>
              </>
            ) : null}
            <span className="hidden h-3 w-px bg-border md:block" />
            <span className="hidden text-muted-foreground tabular-nums md:inline">
              Focus {formatFocusMinutes(status.focusMinutes)}
            </span>
          </div>

          <Button asChild size="sm" className="h-8 shrink-0">
            <Link href="/focus">
              <Timer className="size-3.5" />
              Focus
            </Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 md:gap-8 md:px-8 md:py-10">
        {children}
      </div>
    </>
  );
}
