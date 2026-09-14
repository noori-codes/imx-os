type GoalsStatsProps = {
  goalCount: number;
  projectCount: number;
  completedTasks: number;
  totalTasks: number;
  momentum: number | null;
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
    <div className="goals-stat rounded-2xl border border-border/50 bg-card/80 px-4 py-3.5 sm:px-5 sm:py-4">
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

export function GoalsStats({
  goalCount,
  projectCount,
  completedTasks,
  totalTasks,
  momentum,
}: GoalsStatsProps) {
  return (
    <div className="goals-stats grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <Stat
        label="Goals"
        value={String(goalCount)}
        hint={goalCount === 0 ? "None declared" : "outcomes"}
      />
      <Stat
        label="Projects"
        value={String(projectCount)}
        hint={projectCount === 0 ? "No workstreams" : "workstreams"}
      />
      <Stat
        label="Tasks done"
        value={totalTasks === 0 ? "—" : `${completedTasks}/${totalTasks}`}
        hint={totalTasks === 0 ? "No tasks yet" : "across goals"}
      />
      <Stat
        label="Momentum"
        value={momentum == null ? "—" : `${momentum}%`}
        hint={momentum == null ? "Start a task" : "overall progress"}
      />
    </div>
  );
}
