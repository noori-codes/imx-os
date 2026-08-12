import { Timer } from "lucide-react";

type FocusStatsProps = {
  sessions: number;
  focusMinutes: number;
};

export function FocusStats({ sessions, focusMinutes }: FocusStatsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            Focus sessions today
          </p>
          <Timer className="size-4 text-muted-foreground" />
        </div>
        <p className="mt-2 text-3xl font-semibold tracking-tight">{sessions}</p>
      </div>
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            Focus minutes today
          </p>
          <Timer className="size-4 text-muted-foreground" />
        </div>
        <p className="mt-2 text-3xl font-semibold tracking-tight">
          {focusMinutes}
        </p>
      </div>
    </div>
  );
}
