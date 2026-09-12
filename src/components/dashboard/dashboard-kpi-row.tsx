import Link from "next/link";

import { cn } from "@/lib/utils";
import { formatFocusMinutes } from "@/types/focus";

type DashboardKpiRowProps = {
  dueToday: number;
  overdue: number;
  focusMinutes: number;
  habitsDone: number;
  habitsTotal: number;
  streak: number;
};

function KpiCard({
  label,
  value,
  hint,
  href,
  alert,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  href: string;
  alert?: boolean;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "dash-kpi group relative flex min-w-0 flex-col rounded-2xl border border-border/50 bg-card/80 p-4 transition-colors hover:border-border hover:bg-card sm:p-5",
        alert && "border-destructive/30 hover:border-destructive/50",
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl",
          alert
            ? "text-destructive"
            : accent
              ? "text-amber-700 dark:text-amber-400"
              : "text-foreground",
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      ) : (
        <p className="mt-1.5 text-xs text-transparent" aria-hidden>
          .
        </p>
      )}
    </Link>
  );
}

export function DashboardKpiRow({
  dueToday,
  overdue,
  focusMinutes,
  habitsDone,
  habitsTotal,
  streak,
}: DashboardKpiRowProps) {
  const dueTotal = dueToday + overdue;
  const habitsValue =
    habitsTotal > 0 ? `${habitsDone}/${habitsTotal}` : "—";
  const habitsHint =
    habitsTotal === 0
      ? "No habits yet"
      : habitsDone === habitsTotal
        ? "All sealed"
        : "done today";

  return (
    <div className="dash-kpi-row grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <KpiCard
        label="Due today"
        value={String(dueTotal)}
        hint={
          overdue > 0
            ? `${dueToday} today · ${overdue} overdue`
            : dueTotal === 0
              ? "Inbox clear"
              : "needs attention"
        }
        href="/tasks"
        alert={overdue > 0}
      />
      <KpiCard
        label="Focus"
        value={formatFocusMinutes(focusMinutes)}
        hint={focusMinutes > 0 ? "minutes today" : "not started"}
        href="/focus"
      />
      <KpiCard
        label="Habits"
        value={habitsValue}
        hint={habitsHint}
        href="/habits"
      />
      <KpiCard
        label="Streak"
        value={streak > 0 ? `${streak}d` : "—"}
        hint={streak > 0 ? "days active" : "build momentum"}
        href="/analytics"
        accent={streak >= 7}
      />
    </div>
  );
}
