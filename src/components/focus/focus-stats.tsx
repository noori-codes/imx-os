import { formatFocusMinutes } from "@/types/focus";

type FocusStatsProps = {
  sessions: number;
  focusMinutes: number;
};

export function FocusStats({ sessions, focusMinutes }: FocusStatsProps) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "short" });
  const items = [
    { label: "Today", value: today },
    { label: "Sessions", value: String(sessions) },
    { label: "Focused", value: formatFocusMinutes(focusMinutes) },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-border/60 bg-card px-3 py-3 text-center"
        >
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-1 truncate text-sm font-semibold tabular-nums">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
