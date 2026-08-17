import { formatFocusMinutes } from "@/types/focus";

type FocusStatsProps = {
  sessions: number;
  focusMinutes: number;
};

export function FocusStats({ sessions, focusMinutes }: FocusStatsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="rounded-full bg-muted px-3 py-1 text-sm tabular-nums text-muted-foreground">
        Today
      </p>
      <p className="rounded-full bg-muted px-3 py-1 text-sm tabular-nums">
        {sessions} session{sessions === 1 ? "" : "s"}
      </p>
      <p className="rounded-full bg-muted px-3 py-1 text-sm tabular-nums">
        {formatFocusMinutes(focusMinutes)} focused
      </p>
    </div>
  );
}
