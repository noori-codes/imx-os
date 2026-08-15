import Link from "next/link";
import { Timer } from "lucide-react";

import { Button } from "@/components/ui/button";

type FocusTodayProps = {
  sessions: number;
  focusMinutes: number;
};

export function FocusToday({ sessions, focusMinutes }: FocusTodayProps) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-base font-semibold tracking-tight">Focus</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Today</p>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
            {focusMinutes}
            <span className="ml-1 text-sm font-medium text-muted-foreground">
              min
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {sessions === 0
              ? "No sessions yet"
              : `${sessions} session${sessions === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/focus">
            <Timer className="size-3.5" />
            Start
          </Link>
        </Button>
      </div>
    </section>
  );
}
