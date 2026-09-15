"use client";

import Link from "next/link";
import { Moon } from "lucide-react";

import { reviewHref } from "@/components/review/review-href";
import { EmptyState } from "@/components/shared/empty-state";
import { energyOption, moodOption } from "@/lib/review-scale";
import { parseDateString } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { DailyReview } from "@/types/review";

type ReviewHistoryProps = {
  selectedDate: string;
  recent: Pick<DailyReview, "id" | "review_date" | "mood" | "energy">[];
};

function CloseTheLoopButton() {
  return (
    <button
      type="button"
      onClick={() => {
        document
          .getElementById("review-form")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
        document
          .querySelector<HTMLElement>(
            '#review-form input[name="mood"]:checked, #review-form input[name="mood"]',
          )
          ?.focus({ preventScroll: true });
      }}
      className="mt-5 inline-flex h-9 items-center rounded-xl bg-foreground px-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
    >
      Close the loop
    </button>
  );
}

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
        <EmptyState
          icon={Moon}
          title="No reviews yet"
          description="Saved reviews appear here as a trail."
          variant="plain"
          className="px-5 py-10"
        >
          <CloseTheLoopButton />
        </EmptyState>
      ) : (
        <ul className="divide-y divide-border/30">
          {recent.map((item) => {
            const selected = item.review_date === selectedDate;
            const label = parseDateString(item.review_date).toLocaleDateString(
              undefined,
              { weekday: "short", month: "short", day: "numeric" },
            );
            const mood = moodOption(item.mood);
            const energy = energyOption(item.energy);
            const MoodIcon = mood?.icon;
            const EnergyIcon = energy?.icon;

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
                  <span className="flex items-center gap-2.5 text-muted-foreground">
                    {MoodIcon ? (
                      <span
                        className="inline-flex items-center gap-1"
                        title={`Mood · ${mood?.label}`}
                      >
                        <MoodIcon className="size-3.5" />
                        <span className="hidden text-[11px] sm:inline">
                          {mood?.label}
                        </span>
                      </span>
                    ) : null}
                    {EnergyIcon ? (
                      <span
                        className="inline-flex items-center gap-1"
                        title={`Energy · ${energy?.label}`}
                      >
                        <EnergyIcon className="size-3.5" />
                        <span className="hidden text-[11px] sm:inline">
                          {energy?.label}
                        </span>
                      </span>
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
