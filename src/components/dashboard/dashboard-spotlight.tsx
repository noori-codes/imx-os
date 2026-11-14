import Link from "next/link";
import { ArrowUpRight, BookOpen, Target } from "lucide-react";

import { ProgressRing } from "@/components/dashboard/progress-ring";
import type { GoalProgress } from "@/types/dashboard";

type DashboardSpotlightProps = {
  goals: GoalProgress[];
  readingBook: { id: string; title: string; progress: number | null } | null;
};

/**
 * One secondary story — reading book preferred, else top goal.
 * Keeps home from becoming a second analytics page.
 */
export function DashboardSpotlight({
  goals,
  readingBook,
}: DashboardSpotlightProps) {
  if (readingBook) {
    const pct = Math.max(0, Math.min(100, readingBook.progress ?? 0));
    return (
      <section className="dash-panel relative overflow-hidden">
        <div className="dash-panel-glow" aria-hidden />
        <div className="relative z-[1] flex h-full flex-col justify-between gap-4 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="dash-panel-eyebrow">Reading</p>
              <h3 className="mt-1 truncate text-sm font-semibold tracking-tight">
                {readingBook.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {pct > 0 ? `${pct}% through` : "In progress"}
              </p>
            </div>
            <BookOpen className="size-4 shrink-0 text-muted-foreground/60" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <ProgressRing value={pct} size={48} stroke={3.5}>
              <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                {pct || "—"}
              </span>
            </ProgressRing>
            <Link
              href={`/books#book-${readingBook.id}`}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90"
            >
              Continue
              <ArrowUpRight className="size-3 opacity-70" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const goal = goals[0];
  if (goal) {
    return (
      <section className="dash-panel relative overflow-hidden">
        <div className="dash-panel-glow" aria-hidden />
        <div className="relative z-[1] flex h-full flex-col justify-between gap-4 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="dash-panel-eyebrow">Goal</p>
              <h3 className="mt-1 line-clamp-2 text-sm font-semibold tracking-tight">
                {goal.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {goal.completed_task_count}/{goal.task_count} tasks
              </p>
            </div>
            <Target className="size-4 shrink-0 text-muted-foreground/60" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <ProgressRing value={goal.progress} size={48} stroke={3.5}>
              <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                {goal.progress}%
              </span>
            </ProgressRing>
            <Link
              href={`/goals/${goal.id}`}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-border/60 bg-background px-3 text-xs font-medium transition-colors hover:bg-muted/40"
            >
              Open
              <ArrowUpRight className="size-3 opacity-70" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="dash-panel relative overflow-hidden">
      <div className="dash-panel-glow" aria-hidden />
      <div className="relative z-[1] flex h-full flex-col justify-center gap-3 px-5 py-6 text-center">
        <p className="dash-panel-eyebrow mx-auto">Spotlight</p>
        <p className="text-sm text-muted-foreground">
          Start a book or declare a goal — it’ll show up here.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/books"
            className="inline-flex h-8 items-center rounded-md border border-border/60 px-3 text-xs font-medium hover:bg-muted/40"
          >
            Books
          </Link>
          <Link
            href="/goals?compose=1"
            className="inline-flex h-8 items-center rounded-md bg-foreground px-3 text-xs font-medium text-background hover:opacity-90"
          >
            Add goal
          </Link>
        </div>
      </div>
    </section>
  );
}
