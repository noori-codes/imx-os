import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { calendarHref } from "@/lib/calendar";
import {
  addDays,
  addMonths,
  formatMonthYear,
  parseDateString,
  toDateString,
} from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { CalendarView } from "@/types/calendar";

type CalendarNavProps = {
  view: CalendarView;
  date: string;
};

export function CalendarNav({ view, date }: CalendarNavProps) {
  const anchor = parseDateString(date);
  const today = toDateString(new Date());
  const prev = toDateString(
    view === "month" ? addMonths(anchor, -1) : addDays(anchor, -7),
  );
  const next = toDateString(
    view === "month" ? addMonths(anchor, 1) : addDays(anchor, 7),
  );
  const isToday = date === today;

  return (
    <header className="cal-nav flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">
          {view === "month" ? "Month view" : "Week view"}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {formatMonthYear(anchor)}
          </h2>
          <div className="flex items-center gap-1">
            <Link
              href={calendarHref(view, prev)}
              aria-label="Previous"
              className="inline-flex size-9 items-center justify-center rounded-xl border border-border/60 bg-card/70 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <Link
              href={calendarHref(view, next)}
              aria-label="Next"
              className="inline-flex size-9 items-center justify-center rounded-xl border border-border/60 bg-card/70 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={calendarHref(view, today)}
          className={cn(
            "inline-flex h-9 items-center rounded-xl border px-3.5 text-sm font-medium transition-colors",
            isToday
              ? "border-foreground/15 bg-foreground text-background"
              : "border-border/60 bg-card/70 text-foreground hover:border-border",
          )}
        >
          Today
        </Link>
        <div className="inline-flex rounded-xl border border-border/60 bg-card/70 p-1">
          {(["month", "week"] as const).map((item) => (
            <Link
              key={item}
              href={calendarHref(item, date)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                view === item
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
