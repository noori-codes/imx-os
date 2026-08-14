import Link from "next/link";
import { Moon } from "lucide-react";

import { reviewHref } from "@/components/review/review-nav";
import { parseDateString } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { DailyReview } from "@/types/review";

type ReviewHistoryProps = {
  selectedDate: string;
  recent: Pick<DailyReview, "id" | "review_date" | "mood">[];
};

export function ReviewHistory({ selectedDate, recent }: ReviewHistoryProps) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold">Recent reviews</h2>
      {recent.length === 0 ? (
        <div className="mt-6 flex flex-col items-center py-4 text-center">
          <Moon className="mb-2 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Saved reviews will show up here.
          </p>
        </div>
      ) : (
        <ul className="mt-3 space-y-1">
          {recent.map((item) => {
            const selected = item.review_date === selectedDate;
            const label = parseDateString(item.review_date).toLocaleDateString(
              "en-US",
              { weekday: "short", month: "short", day: "numeric" },
            );

            return (
              <li key={item.id}>
                <Link
                  href={reviewHref(item.review_date)}
                  className={cn(
                    "flex items-center justify-between rounded-md px-2 py-1.5 text-sm",
                    selected
                      ? "bg-accent font-medium"
                      : "hover:bg-accent/50",
                  )}
                >
                  <span>{label}</span>
                  {item.mood ? (
                    <span className="text-xs text-muted-foreground">
                      mood {item.mood}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
