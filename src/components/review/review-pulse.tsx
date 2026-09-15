"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ProgressRing } from "@/components/dashboard/progress-ring";
import { reviewHref } from "@/components/review/review-href";
import {
  addDays,
  formatWeekdayLong,
  parseDateString,
  toDateString,
} from "@/lib/date-utils";
import { energyOption, moodOption } from "@/lib/review-scale";
import { cn } from "@/lib/utils";
import type { DailyReview, ReviewRecap } from "@/types/review";

type ReviewPulseProps = {
  date: string;
  recap: ReviewRecap;
  review: DailyReview | null;
};

function pulseCopy({
  isToday,
  review,
  recap,
  openDue,
}: {
  isToday: boolean;
  review: DailyReview | null;
  recap: ReviewRecap;
  openDue: number;
}) {
  const mood = moodOption(review?.mood);
  const energy = energyOption(review?.energy);

  if (review) {
    return {
      title: isToday ? "Day sealed" : "Reviewed",
      body: [
        mood ? `Mood · ${mood.label}` : null,
        energy ? `Energy · ${energy.label}` : null,
        recap.focus_minutes > 0 ? `${recap.focus_minutes}m focus` : null,
      ]
        .filter(Boolean)
        .join(" · ") || "Reflection saved. Edit anything below if the story shifted.",
      sealed: true,
    };
  }

  if (openDue > 0) {
    return {
      title: isToday ? "Still open" : "Unreviewed",
      body: `${openDue} open task${openDue === 1 ? "" : "s"} due on or before this day · ${recap.habits_done}/${Math.max(recap.habits_total, 1)} habits · close the loop below.`,
      sealed: false,
    };
  }

  return {
    title: isToday ? "Evening ritual" : "Past reflection",
    body:
      recap.tasks_completed.length > 0 || recap.habits_done > 0
        ? `${recap.tasks_completed.length} done · ${recap.habits_done}/${Math.max(recap.habits_total, 0) || "—"} habits · add mood and three prompts.`
        : "Close the day with mood, energy, and three honest prompts.",
    sealed: false,
  };
}

export function ReviewPulse({ date, recap, review }: ReviewPulseProps) {
  const anchor = parseDateString(date);
  const today = toDateString(new Date());
  const prev = toDateString(addDays(anchor, -1));
  const next = toDateString(addDays(anchor, 1));
  const isToday = date === today;
  const openDue = recap.tasks_due.filter((task) => !task.completed).length;
  const copy = pulseCopy({ isToday, review, recap, openDue });

  const habitProgress =
    recap.habits_total > 0
      ? Math.round((recap.habits_done / recap.habits_total) * 100)
      : review
        ? 100
        : 0;

  const mood = moodOption(review?.mood);

  return (
    <section
      className={cn(
        "review-pulse relative overflow-hidden py-2 sm:py-3",
        copy.sealed && "review-pulse-sealed",
      )}
    >
      <div className="review-pulse-vignette" aria-hidden />
      <div className="review-pulse-glow" aria-hidden />

      <div className="relative z-1 flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {isToday ? "Evening ritual" : "Past reflection"}
              {review ? " · sealed" : ""}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {formatWeekdayLong(anchor)}
              </h2>
              <div className="flex items-center gap-1">
                <Link
                  href={reviewHref(prev)}
                  aria-label="Previous day"
                  className="inline-flex size-9 items-center justify-center rounded-xl border border-border/55 bg-background/50 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                >
                  <ChevronLeft className="size-4" />
                </Link>
                <Link
                  href={reviewHref(next)}
                  aria-label="Next day"
                  className="inline-flex size-9 items-center justify-center rounded-xl border border-border/55 bg-background/50 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                >
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isToday ? (
              <Link
                href={reviewHref(today)}
                className="inline-flex h-9 items-center rounded-xl border border-border/55 bg-background/50 px-3.5 text-sm font-medium text-foreground transition-colors hover:border-border"
              >
                Today
              </Link>
            ) : (
              <span
                className={cn(
                  "inline-flex h-9 items-center rounded-xl border px-3.5 text-sm font-medium",
                  review
                    ? "border-foreground/15 bg-foreground text-background"
                    : "border-border/55 bg-background/50 text-muted-foreground",
                )}
              >
                {review ? "Reviewed" : "Open"}
              </span>
            )}
            {!review ? (
              <button
                type="button"
                onClick={() => {
                  const targetId =
                    openDue > 0 ? "review-still-due" : "review-form";
                  document
                    .getElementById(targetId)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  if (openDue > 0) return;
                  document
                    .querySelector<HTMLElement>(
                      '#review-form input[name="mood"]:checked, #review-form input[name="mood"]',
                    )
                    ?.focus({ preventScroll: true });
                }}
                className="inline-flex h-9 items-center rounded-xl bg-foreground px-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                {openDue > 0 ? "Triage still due" : "Close the loop"}
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h3 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {copy.title}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground sm:mx-0">
              {copy.body}
            </p>

            <div className="review-pulse-instruments mt-5 grid grid-cols-3 gap-4 sm:max-w-sm">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Done
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                  {recap.tasks_completed.length > 0
                    ? recap.tasks_completed.length
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Habits
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                  {recap.habits_total > 0
                    ? `${recap.habits_done}/${recap.habits_total}`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Focus
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                  {recap.focus_minutes > 0 ? `${recap.focus_minutes}m` : "—"}
                </p>
              </div>
            </div>
          </div>

          <ProgressRing
            value={habitProgress}
            size={128}
            stroke={7}
            sealed={copy.sealed}
            featured
            className="mx-auto sm:mx-0"
          >
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
                {mood?.label ??
                  (recap.habits_total > 0
                    ? `${recap.habits_done}/${recap.habits_total}`
                    : "—")}
              </p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {mood ? "mood" : copy.sealed ? "sealed" : "habits"}
              </p>
            </div>
          </ProgressRing>
        </div>
      </div>
    </section>
  );
}
