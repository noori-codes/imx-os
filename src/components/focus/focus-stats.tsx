import { formatFocusMinutes } from "@/types/focus";

type FocusStatsProps = {
  sessions: number;
  focusMinutes: number;
};

export function FocusStats({ sessions, focusMinutes }: FocusStatsProps) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-4">
      <p className="text-sm text-muted-foreground">Today</p>
      <p className="text-sm tabular-nums text-foreground">
        {sessions} session{sessions === 1 ? "" : "s"}
        <span className="mx-2 text-border">·</span>
        {formatFocusMinutes(focusMinutes)}
      </p>
    </div>
  );
}
