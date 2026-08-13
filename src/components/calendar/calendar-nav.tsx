import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
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

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon">
          <Link href={calendarHref(view, prev)} aria-label="Previous">
            <ChevronLeft className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="icon">
          <Link href={calendarHref(view, next)} aria-label="Next">
            <ChevronRight className="size-4" />
          </Link>
        </Button>
        <h2 className="ml-1 text-lg font-semibold tracking-tight">
          {formatMonthYear(anchor)}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={calendarHref(view, today)}>Today</Link>
        </Button>
        <div className="flex rounded-md border p-0.5">
          {(["month", "week"] as const).map((item) => (
            <Link
              key={item}
              href={calendarHref(item, date)}
              className={cn(
                "rounded-sm px-3 py-1 text-sm font-medium capitalize",
                view === item
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
