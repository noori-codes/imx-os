import { formatFocusMinutesCompact } from "@/types/focus";

type FocusKpisProps = {
  focusMinutes: number;
  goalMinutes: number;
  streak: number;
  sessionsToday: number;
};

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="focus-kpi rounded-2xl border border-border/50 bg-card/80 px-4 py-3.5 sm:px-5 sm:py-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums text-foreground sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function FocusKpis({
  focusMinutes,
  goalMinutes,
  streak,
  sessionsToday,
}: FocusKpisProps) {
  const goalPct =
    goalMinutes > 0
      ? Math.min(100, Math.round((focusMinutes / goalMinutes) * 100))
      : 0;
  const remaining = Math.max(0, goalMinutes - focusMinutes);

  return (
    <div className="focus-kpis grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <Stat
        label="Today"
        value={
          focusMinutes > 0
            ? formatFocusMinutesCompact(focusMinutes) || `${focusMinutes}m`
            : "—"
        }
        hint={
          focusMinutes === 0
            ? "No focus yet"
            : remaining > 0
              ? `${formatFocusMinutesCompact(remaining) || `${remaining}m`} to goal`
              : "Goal sealed"
        }
      />
      <Stat
        label="Goal"
        value={`${goalPct}%`}
        hint={
          goalMinutes > 0
            ? `of ${formatFocusMinutesCompact(goalMinutes) || `${goalMinutes}m`}`
            : "Set in Settings"
        }
      />
      <Stat
        label="Streak"
        value={streak > 0 ? `${streak}d` : "—"}
        hint={streak > 0 ? "days with focus" : "Start today"}
      />
      <Stat
        label="Sessions"
        value={sessionsToday > 0 ? String(sessionsToday) : "—"}
        hint={sessionsToday === 1 ? "today" : "today"}
      />
    </div>
  );
}
