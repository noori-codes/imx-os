import { formatFocusMinutes } from "@/types/focus";

type FocusStatsProps = {
  sessions: number;
  focusMinutes: number;
};

export function FocusStats({ sessions, focusMinutes }: FocusStatsProps) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "short" });

  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-border/60 pb-4 text-sm text-muted-foreground">
      <span>
        Today{" "}
        <span className="tabular-nums text-foreground">{today}</span>
      </span>
      <span>
        Sessions{" "}
        <span className="tabular-nums text-foreground">{sessions}</span>
      </span>
      <span>
        Focused{" "}
        <span className="tabular-nums text-foreground">
          {formatFocusMinutes(focusMinutes)}
        </span>
      </span>
    </div>
  );
}
