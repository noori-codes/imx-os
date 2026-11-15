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
 */
export function DashboardSpotlight({
  goals,
  readingBook,
}: DashboardSpotlightProps) {
  if (readingBook) {
    const pct = Math.max(0, Math.min(100, readingBook.progress ?? 0));
    return (
      <section className="dash-panel relative flex h-full min-h-0 flex-col overflow-hidden">
        <div className="dash-tile-head">
          <div className="min-w-0">
            <p className="dash-panel-eyebrow">Reading</p>
            <h3 className="dash-tile-title truncate">{readingBook.title}</h3>
            <p className="dash-tile-sub">
              {pct > 0 ? `${pct}% through` : "In progress"}
            </p>
          </div>
          <BookOpen className="size-4 shrink-0 text-muted-foreground/55" />
        </div>
        <div className="dash-tile-rule" aria-hidden />
        <div className="relative z-[1] mt-auto flex items-center justify-between gap-3 px-5 py-4">
          <ProgressRing value={pct} size={48} stroke={3.5}>
            <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
              {pct || "—"}
            </span>
          </ProgressRing>
          <Link
            href={`/books#book-${readingBook.id}`}
            className="inline-flex h-8 items-center gap-1 rounded-xl bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90"
          >
            Continue
            <ArrowUpRight className="size-3 opacity-70" />
          </Link>
        </div>
      </section>
    );
  }

  const goal = goals[0];
  if (goal) {
    return (
      <section className="dash-panel relative flex h-full min-h-0 flex-col overflow-hidden">
        <div className="dash-tile-head">
          <div className="min-w-0">
            <p className="dash-panel-eyebrow">Goal</p>
            <h3 className="dash-tile-title line-clamp-2">{goal.title}</h3>
            <p className="dash-tile-sub">
              {goal.completed_task_count}/{goal.task_count} tasks
            </p>
          </div>
          <Target className="size-4 shrink-0 text-muted-foreground/55" />
        </div>
        <div className="dash-tile-rule" aria-hidden />
        <div className="relative z-[1] mt-auto flex items-center justify-between gap-3 px-5 py-4">
          <ProgressRing value={goal.progress} size={48} stroke={3.5}>
            <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
              {goal.progress}%
            </span>
          </ProgressRing>
          <Link
            href={`/goals/${goal.id}`}
            className="inline-flex h-8 items-center gap-1 rounded-xl border border-border/60 bg-background px-3 text-xs font-medium transition-colors hover:bg-muted/40"
          >
            Open
            <ArrowUpRight className="size-3 opacity-70" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="dash-panel relative flex h-full min-h-0 flex-col overflow-hidden">
      <div className="dash-tile-head">
        <div>
          <p className="dash-panel-eyebrow">Spotlight</p>
          <h3 className="dash-tile-title">Nothing yet</h3>
          <p className="dash-tile-sub">A book or goal will live here.</p>
        </div>
      </div>
      <div className="dash-tile-rule" aria-hidden />
      <div className="relative z-[1] mt-auto flex flex-wrap items-center gap-2 px-5 py-4">
        <Link
          href="/books"
          className="inline-flex h-8 items-center rounded-xl border border-border/60 px-3 text-xs font-medium hover:bg-muted/40"
        >
          Books
        </Link>
        <Link
          href="/goals?compose=1"
          className="inline-flex h-8 items-center rounded-xl bg-foreground px-3 text-xs font-medium text-background hover:opacity-90"
        >
          Add goal
        </Link>
      </div>
    </section>
  );
}
