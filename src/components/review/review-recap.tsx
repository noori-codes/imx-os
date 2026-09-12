import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Circle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { ReviewRecap } from "@/types/review";

type ReviewRecapCardProps = {
  recap: ReviewRecap;
};

export function ReviewRecapCard({ recap }: ReviewRecapCardProps) {
  const openDue = recap.tasks_due.filter((task) => !task.completed);

  return (
    <aside className="review-recap overflow-hidden rounded-2xl border border-border/50 bg-card/80">
      <div className="border-b border-border/40 px-5 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Day pulse
        </p>
        <h3 className="mt-1 text-sm font-semibold text-foreground">
          At a glance
        </h3>
      </div>

      <div className="space-y-5 px-5 py-4">
        {recap.has_journal && recap.journal_id ? (
          <Link
            href={`/notes/${recap.journal_id}`}
            className="flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-amber-500/15"
          >
            <BookOpen className="size-4 shrink-0 text-amber-700 dark:text-amber-400" />
            Open today&apos;s journal
          </Link>
        ) : (
          <Link
            href="/notes"
            className="flex items-center gap-2.5 rounded-xl border border-border/50 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          >
            <BookOpen className="size-4 shrink-0" />
            Write a journal entry
          </Link>
        )}

        {recap.events_count > 0 ? (
          <p className="text-xs text-muted-foreground">
            {recap.events_count} calendar event
            {recap.events_count === 1 ? "" : "s"} today
          </p>
        ) : null}

        {recap.habits.length > 0 ? (
          <section>
            <h4 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Habits
            </h4>
            <ul className="mt-2.5 space-y-2">
              {recap.habits.map((habit) => (
                <li key={habit.id} className="flex items-center gap-2.5 text-sm">
                  {habit.completed ? (
                    <CheckCircle2
                      className="size-4 shrink-0"
                      style={{ color: habit.color }}
                    />
                  ) : (
                    <Circle className="size-4 shrink-0 text-muted-foreground/50" />
                  )}
                  <span
                    className={cn(
                      habit.completed
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {habit.title}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {openDue.length > 0 ? (
          <section>
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Still due
              </h4>
              <Link
                href="/tasks"
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Tasks
              </Link>
            </div>
            <ul className="mt-2.5 space-y-2">
              {openDue.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-2.5 text-sm text-foreground"
                >
                  <Circle className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{task.title}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {recap.tasks_completed.length > 0 ? (
          <section>
            <h4 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Completed
            </h4>
            <ul className="mt-2.5 space-y-2">
              {recap.tasks_completed.slice(0, 8).map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-2.5 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="size-3.5 shrink-0 text-foreground/55" />
                  <span className="truncate line-through">{task.title}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {recap.habits.length === 0 &&
        openDue.length === 0 &&
        recap.tasks_completed.length === 0 &&
        !recap.has_journal ? (
          <p className="text-sm text-muted-foreground">
            Quiet day so far — room to begin.
          </p>
        ) : null}
      </div>
    </aside>
  );
}
