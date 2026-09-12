import Link from "next/link";
import { Moon } from "lucide-react";

import { reviewHref } from "@/components/review/review-nav";
import { parseDateString } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { DailyReview } from "@/types/review";

type ReviewHistoryProps = {
  selectedDate: string;
  recent: Pick<DailyReview, "id" | "review_date" | "mood" | "energy">[];
};

export function ReviewHistory({ selectedDate, recent }: ReviewHistoryProps) {
  return (
    <section className="review-history overflow-hidden rounded-2xl border border-border/50 bg-card/80">
      <div className="border-b border-border/40 px-5 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Archive
        </p>
        <h3 className="mt-1 text-sm font-semibold text-foreground">
          Recent reviews
        </h3>
      </div>

      {recent.length === 0 ? (
        <div className="flex flex-col items-center px-5 py-10 text-center">
          <Moon className="mb-2 size-7 text-muted-foreground/70" />
          <p className="text-sm text-muted-foreground">
            Saved reviews appear here as a trail.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/30">
          {recent.map((item) => {
            const selected = item.review_date === selectedDate;
            const label = parseDateString(item.review_date).toLocaleDateString(
              undefined,
              { weekday: "short", month: "short", day: "numeric" },
            );

            return (
              <li key={item.id}>
                <Link
                  href={reviewHref(item.review_date)}
                  className={cn(
                    "flex items-center justify-between gap-3 px-5 py-3 text-sm transition-colors",
                    selected
                      ? "bg-muted/50 font-medium text-foreground"
                      : "text-foreground hover:bg-muted/40",
                  )}
                >
                  <span>{label}</span>
                  <span className="flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
                    {item.mood != null ? (
                      <span title="Mood">M{item.mood}</span>
                    ) : null}
                    {item.energy != null ? (
                      <span title="Energy">E{item.energy}</span>
                    ) : null}
                    {item.mood == null && item.energy == null ? (
                      <span>—</span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
