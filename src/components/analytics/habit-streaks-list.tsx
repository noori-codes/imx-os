import Link from "next/link";
import { CheckSquare } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import type { HabitStreakSummary } from "@/types/analytics";

type HabitStreaksListProps = {
  streaks: HabitStreakSummary[];
  rangeDays: number;
};

export function HabitStreaksList({ streaks, rangeDays }: HabitStreaksListProps) {
  return (
    <section className="w-full">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Streaks
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Current · best · last {rangeDays}d rate
          </p>
        </div>
        <Link
          href="/habits"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Manage
        </Link>
      </div>

      {streaks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No streaks yet"
          description="Add habits and check them in to build streaks."
          variant="panel"
          className="mt-5 py-10"
        >
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/habits?compose=1"
              className="inline-flex h-9 items-center rounded-xl bg-foreground px-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Add habit
            </Link>
            <Link
              href="/habits"
              className="inline-flex h-9 items-center rounded-xl border border-border/60 bg-card/70 px-3.5 text-sm font-medium text-foreground transition-colors hover:border-border"
            >
              Manage habits
            </Link>
          </div>
        </EmptyState>
      ) : (
        <ul className="mt-5 divide-y divide-border/40">
          {streaks.map((habit) => (
            <li
              key={habit.id}
              className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: habit.color }}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">
                    {habit.title}
                  </p>
                  <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                    {habit.completion_rate}% · {habit.days_logged}d logged
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right tabular-nums">
                <p className="text-sm font-medium text-foreground">
                  {habit.current_streak}d
                </p>
                <p className="text-[11px] text-muted-foreground">
                  best {habit.longest_streak}d
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
