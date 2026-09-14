type SettingsStatsProps = {
  themeLabel: string;
  focusGoalLabel: string;
  notifyLabel: string;
  memberLabel: string;
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
    <div className="settings-stat rounded-2xl border border-border/50 bg-card/80 px-4 py-3.5 sm:px-5 sm:py-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function SettingsStats({
  themeLabel,
  focusGoalLabel,
  notifyLabel,
  memberLabel,
}: SettingsStatsProps) {
  return (
    <div className="settings-stats grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <Stat label="Theme" value={themeLabel} hint="appearance" />
      <Stat label="Focus goal" value={focusGoalLabel} hint="per day" />
      <Stat label="Alerts" value={notifyLabel} hint="browser notices" />
      <Stat label="Member" value={memberLabel} hint="since signup" />
    </div>
  );
}
