type HabitsStatsProps = {
  doneToday: number;
  activeCount: number;
  bestStreak: number;
  weekRate: number | null;
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
    <div className="habits-stat rounded-2xl border border-border/50 bg-card/80 px-4 py-3.5 sm:px-5 sm:py-4">
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

export function HabitsStats({
  doneToday,
  activeCount,
  bestStreak,
  weekRate,
}: HabitsStatsProps) {
  const remaining = Math.max(0, activeCount - doneToday);
  const clear = activeCount > 0 && remaining === 0;

  return (
    <div className="habits-stats grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <Stat
        label="Today"
        value={activeCount === 0 ? "—" : `${doneToday}/${activeCount}`}
        hint={
          activeCount === 0
            ? "No active habits"
            : clear
              ? "All sealed"
              : `${remaining} remaining`
        }
      />
      <Stat
        label="Active"
        value={String(activeCount)}
        hint={activeCount === 0 ? "Start one" : "daily rituals"}
      />
      <Stat
        label="Best streak"
        value={bestStreak > 0 ? `${bestStreak}d` : "—"}
        hint={bestStreak > 0 ? "personal best" : "Check in to start"}
      />
      <Stat
        label="Week rate"
        value={weekRate == null ? "—" : `${weekRate}%`}
        hint={weekRate == null ? "No check-ins yet" : "last 7 days"}
      />
    </div>
  );
}
