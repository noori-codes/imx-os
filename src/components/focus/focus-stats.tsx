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
    <section className="rounded-[1.75rem] border border-border/60 bg-card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Session Snapshot
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl bg-muted/45 px-3 py-3 text-center"
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
    </section>
  );
}
