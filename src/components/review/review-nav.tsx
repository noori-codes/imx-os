import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  addDays,
  formatWeekdayLong,
  parseDateString,
  toDateString,
} from "@/lib/date-utils";
import { cn } from "@/lib/utils";

type ReviewNavProps = {
  date: string;
  hasReview: boolean;
};

export function reviewHref(date: string) {
  return `/review?date=${date}`;
}

export function ReviewNav({ date, hasReview }: ReviewNavProps) {
  const anchor = parseDateString(date);
  const today = toDateString(new Date());
  const prev = toDateString(addDays(anchor, -1));
  const next = toDateString(addDays(anchor, 1));
  const isToday = date === today;

  return (
    <header className="review-nav flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">
          {isToday ? "Evening ritual" : "Past reflection"}
          {hasReview ? " · sealed" : ""}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {formatWeekdayLong(anchor)}
          </h2>
          <div className="flex items-center gap-1">
            <Link
              href={reviewHref(prev)}
              aria-label="Previous day"
              className="inline-flex size-9 items-center justify-center rounded-xl border border-border/60 bg-card/70 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <Link
              href={reviewHref(next)}
              aria-label="Next day"
              className="inline-flex size-9 items-center justify-center rounded-xl border border-border/60 bg-card/70 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>
        <p className="mt-1.5 max-w-lg text-sm text-muted-foreground">
          Close the day with mood, energy, and three honest prompts.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!isToday ? (
          <Link
            href={reviewHref(today)}
            className="inline-flex h-9 items-center rounded-xl border border-border/60 bg-card/70 px-3.5 text-sm font-medium text-foreground transition-colors hover:border-border"
          >
            Today
          </Link>
        ) : (
          <span
            className={cn(
              "inline-flex h-9 items-center rounded-xl border px-3.5 text-sm font-medium",
              hasReview
                ? "border-foreground/15 bg-foreground text-background"
                : "border-border/60 bg-card/70 text-muted-foreground",
            )}
          >
            {hasReview ? "Reviewed" : "Open"}
          </span>
        )}
      </div>
    </header>
  );
}
