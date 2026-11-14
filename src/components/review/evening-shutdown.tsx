"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Moon, Sparkles } from "lucide-react";

import { celebrateMeaningfulClear } from "@/lib/completion-payoff";
import { isPlanCommitted, readDailyPlan, type DailyPlan } from "@/lib/daily-plan";
import { cn } from "@/lib/utils";
import type { DailyReview, ReviewRecap } from "@/types/review";

type EveningShutdownProps = {
  date: string;
  recap: ReviewRecap;
  review: DailyReview | null;
};

export function EveningShutdown({ date, recap, review }: EveningShutdownProps) {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [celebrated, setCelebrated] = useState(false);

  useEffect(() => {
    setPlan(readDailyPlan(date));
  }, [date]);

  const topProgress = useMemo(() => {
    if (!plan || plan.topTaskIds.length === 0) return null;
    const done = plan.topTaskIds.filter((id) => {
      const due = recap.tasks_due.find((t) => t.id === id);
      const completed = recap.tasks_completed.find((t) => t.id === id);
      return Boolean(due?.completed || completed);
    }).length;
    return { done, total: plan.topTaskIds.length };
  }, [plan, recap.tasks_completed, recap.tasks_due]);

  const habitsDone = recap.habits_done;
  const habitsTotal = recap.habits_total;
  const topClear = topProgress != null && topProgress.done === topProgress.total;
  const sealed = Boolean(review);

  useEffect(() => {
    if (!sealed || celebrated || !topClear) return;
    const key = `imx-shutdown-celebrate-${date}`;
    try {
      if (window.localStorage.getItem(key) === "1") {
        setCelebrated(true);
        return;
      }
      window.localStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    celebrateMeaningfulClear("shutdown");
    setCelebrated(true);
  }, [sealed, celebrated, topClear, date]);

  if (sealed) {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-foreground/10 imx-surface px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-muted/40 text-foreground">
            <Check className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Evening shutdown
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              Day sealed
              {topClear ? " · Top 3 complete" : ""}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {recap.focus_minutes > 0
                ? `${recap.focus_minutes}m focus · `
                : ""}
              {habitsTotal > 0
                ? `${habitsDone}/${habitsTotal} habits · `
                : ""}
              Review saved for tonight.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const planned = plan && isPlanCommitted(plan);

  return (
    <section className="relative overflow-hidden rounded-2xl imx-surface imx-surface-rim px-5 py-5 sm:px-6">
      <div className="review-form-glow" aria-hidden />
      <div className="relative z-1 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <Moon className="size-3 opacity-70" aria-hidden />
            Evening shutdown
          </p>
          <h3 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground">
            Close the loop
          </h3>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
            Glance the day, seal a short review, and set tomorrow’s focus below.
          </p>
        </div>
        {topClear ? (
          <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-foreground/15 bg-foreground/5 px-2.5 py-1 text-xs font-medium text-foreground">
            <Sparkles className="size-3 opacity-70" aria-hidden />
            Top 3 done
          </span>
        ) : null}
      </div>

      <dl className="relative z-1 mt-5 grid gap-2 sm:grid-cols-3">
        <Stat
          label="Top 3"
          value={
            topProgress
              ? `${topProgress.done}/${topProgress.total}`
              : planned
                ? "—"
                : "No plan"
          }
          hint={topClear ? "Cleared" : planned ? "Still open" : "Optional"}
          good={topClear}
        />
        <Stat
          label="Habits"
          value={habitsTotal > 0 ? `${habitsDone}/${habitsTotal}` : "—"}
          hint={habitsTotal === 0 ? "None today" : "Logged"}
          good={habitsTotal > 0 && habitsDone === habitsTotal}
        />
        <Stat
          label="Focus"
          value={recap.focus_minutes > 0 ? `${recap.focus_minutes}m` : "0m"}
          hint={
            recap.focus_sessions > 0
              ? `${recap.focus_sessions} session${recap.focus_sessions === 1 ? "" : "s"}`
              : "No sessions"
          }
          good={recap.focus_minutes > 0}
        />
      </dl>

      <p className="relative z-1 mt-4 text-xs text-muted-foreground">
        Scroll to Reflection to seal mood, energy, and tomorrow’s lines.
      </p>
      <a
        href="#review-form"
        className="relative z-1 mt-3 inline-flex h-9 items-center rounded-xl bg-foreground px-4 text-xs font-medium text-background transition-opacity hover:opacity-90"
      >
        Seal review
      </a>
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
  good,
}: {
  label: string;
  value: string;
  hint: string;
  good?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-3.5 py-3",
        good
          ? "border-foreground/15 bg-foreground/[0.04]"
          : "border-border/40 bg-muted/20",
      )}
    >
      <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-base font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </dd>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}
