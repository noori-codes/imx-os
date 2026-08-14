import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { addDays, formatWeekdayLong, parseDateString, toDateString } from "@/lib/date-utils";

type ReviewNavProps = {
  date: string;
};

export function reviewHref(date: string) {
  return `/review?date=${date}`;
}

export function ReviewNav({ date }: ReviewNavProps) {
  const anchor = parseDateString(date);
  const today = toDateString(new Date());
  const prev = toDateString(addDays(anchor, -1));
  const next = toDateString(addDays(anchor, 1));
  const isToday = date === today;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon">
          <Link href={reviewHref(prev)} aria-label="Previous day">
            <ChevronLeft className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="icon">
          <Link href={reviewHref(next)} aria-label="Next day">
            <ChevronRight className="size-4" />
          </Link>
        </Button>
        <div className="ml-1">
          <h2 className="text-lg font-semibold tracking-tight">
            {formatWeekdayLong(anchor)}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isToday ? "Today's review" : "Past day"}
          </p>
        </div>
      </div>

      {isToday ? null : (
        <Button asChild variant="outline" size="sm">
          <Link href={reviewHref(today)}>Today</Link>
        </Button>
      )}
    </div>
  );
}
