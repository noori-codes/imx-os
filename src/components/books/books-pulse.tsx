import Link from "next/link";

import { BookFormDialog } from "@/components/books/book-form-dialog";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { cn } from "@/lib/utils";

export type BooksPulseStats = {
  reading: number;
  finishedYear: number;
  wantToRead: number;
  avgRating: number | null;
  year: number;
  /** Average page progress across books currently reading (0–100). */
  readingProgress: number | null;
  currentTitle: string | null;
};

type BooksPulseProps = {
  stats: BooksPulseStats;
};

function pulseCopy(stats: BooksPulseStats) {
  if (stats.reading === 0 && stats.finishedYear === 0 && stats.wantToRead === 0) {
    return {
      title: "Empty shelf",
      body: "Add a book you’re reading, finished, or want to start next.",
      sealed: false,
    };
  }

  if (stats.reading > 0 && stats.currentTitle) {
    return {
      title:
        stats.reading === 1
          ? "In the middle"
          : `${stats.reading} open`,
      body:
        stats.reading === 1
          ? `Currently reading “${stats.currentTitle}”. Keep the bookmark honest.`
          : `Lead book: “${stats.currentTitle}” · ${stats.wantToRead > 0 ? `${stats.wantToRead} waiting` : "queue clear"}.`,
      sealed: false,
    };
  }

  if (stats.wantToRead > 0 && stats.reading === 0) {
    return {
      title: stats.wantToRead === 1 ? "One queued" : `${stats.wantToRead} queued`,
      body: "Nothing open right now — start one from the shelf or add a fresh title.",
      sealed: false,
    };
  }

  return {
    title:
      stats.finishedYear === 0
        ? "Shelf ready"
        : stats.finishedYear === 1
          ? "One finished"
          : `${stats.finishedYear} finished`,
    body:
      stats.finishedYear > 0
        ? `${stats.finishedYear} sealed in ${stats.year}${stats.avgRating != null ? ` · avg ${stats.avgRating.toFixed(1)}★` : ""}.`
        : "Track progress, finish dates, and ratings as you go.",
    sealed: stats.reading === 0 && stats.finishedYear > 0,
  };
}

export function BooksPulse({ stats }: BooksPulseProps) {
  const copy = pulseCopy(stats);
  const ringValue =
    stats.readingProgress != null
      ? stats.readingProgress
      : stats.reading === 0 && stats.finishedYear > 0
        ? 100
        : 0;

  return (
    <section
      className={cn(
        "books-pulse relative overflow-hidden rounded-[1.75rem] border border-border/50 bg-card/85 px-5 py-6 sm:px-7 sm:py-8",
        copy.sealed && "books-pulse-sealed",
      )}
    >
      <div className="books-pulse-vignette" aria-hidden />
      <div className="books-pulse-glow" aria-hidden />

      <div className="relative z-1 flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 text-center sm:text-left">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Reading shelf
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Books
            </h2>
          </div>
          <div className="flex justify-center sm:justify-end">
            <BookFormDialog />
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

            {stats.reading === 0 &&
            stats.finishedYear === 0 &&
            stats.wantToRead === 0 ? (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Link
                  href="/books?compose=1"
                  className="inline-flex h-9 items-center rounded-xl bg-foreground px-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  Add book
                </Link>
              </div>
            ) : null}

            <div className="books-pulse-instruments mt-5 grid grid-cols-3 gap-4 sm:max-w-sm">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Reading
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                  {stats.reading > 0 ? stats.reading : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Finished
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                  {stats.finishedYear > 0 ? stats.finishedYear : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Queue
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                  {stats.wantToRead > 0 ? stats.wantToRead : "—"}
                </p>
              </div>
            </div>
          </div>

          <ProgressRing
            value={ringValue}
            size={128}
            stroke={7}
            sealed={copy.sealed || (stats.readingProgress != null && stats.readingProgress >= 100)}
            featured
            className="mx-auto sm:mx-0"
          >
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
                {stats.readingProgress != null
                  ? `${stats.readingProgress}%`
                  : stats.avgRating != null
                    ? stats.avgRating.toFixed(1)
                    : "—"}
              </p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {stats.readingProgress != null
                  ? "pages"
                  : stats.avgRating != null
                    ? "avg ★"
                    : "shelf"}
              </p>
            </div>
          </ProgressRing>
        </div>
      </div>
    </section>
  );
}
