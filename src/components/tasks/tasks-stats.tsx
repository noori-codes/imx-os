type TasksStatsProps = {
  openCount: number;
  overdueCount: number;
  doneToday: number;
  focusMinutes: number;
};

function Stat({
  label,
  value,
  hint,
  alert,
}: {
  label: string;
  value: string;
  hint: string;
  alert?: boolean;
}) {
  return (
    <div className="tasks-stat rounded-2xl border border-border/50 bg-card/80 px-4 py-3.5 sm:px-5 sm:py-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1.5 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl ${
          alert ? "text-destructive" : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function TasksStats({
  openCount,
  overdueCount,
  doneToday,
  focusMinutes,
}: TasksStatsProps) {
  return (
    <div className="tasks-stats grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <Stat
        label="Open"
        value={String(openCount)}
        hint={openCount === 0 ? "All clear" : "still in flight"}
      />
      <Stat
        label="Overdue"
        value={String(overdueCount)}
        hint={overdueCount === 0 ? "Nothing late" : "needs attention"}
        alert={overdueCount > 0}
      />
      <Stat
        label="Done today"
        value={String(doneToday)}
        hint={doneToday === 0 ? "None sealed yet" : "checked off"}
      />
      <Stat
        label="Focus"
        value={focusMinutes > 0 ? `${focusMinutes}m` : "—"}
        hint={focusMinutes > 0 ? "on tasks today" : "No focus yet"}
      />
    </div>
  );
}
