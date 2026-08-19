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
    <section className="rounded-[1.75rem] border border-border/60 bg-card/95 p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Session Snapshot
          </p>
          <h2 className="mt-1 text-base font-semibold">Today at a glance</h2>
        </div>
        <span className="rounded-full border border-border/70 bg-muted/35 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          Live
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-border/60 bg-muted/30 px-3 py-3 text-center"
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
