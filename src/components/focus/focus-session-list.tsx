import { Clock, Trash2 } from "lucide-react";

import { deleteFocusSession } from "@/actions/focus";
import { Button } from "@/components/ui/button";
import { FOCUS_PRESETS, type FocusSession } from "@/types/focus";

type FocusSessionListProps = {
  sessions: FocusSession[];
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function FocusSessionList({ sessions }: FocusSessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center">
        <Clock className="mb-3 size-8 text-muted-foreground" />
        <h3 className="font-medium">No sessions yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Start a focus timer above. Completed (and interrupted) sessions will
          show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold">Recent sessions</h2>
      <ul className="mt-3 space-y-2">
        {sessions.map((session) => (
          <li
            key={session.id}
            className="flex items-center gap-3 rounded-lg border bg-background/60 px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {FOCUS_PRESETS[session.mode].label}
                {!session.completed ? (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    (stopped early)
                  </span>
                ) : null}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDuration(session.actual_seconds)}
                {" · "}
                {formatWhen(session.started_at)}
              </p>
            </div>

            <form action={deleteFocusSession.bind(null, session.id)}>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                aria-label="Delete session"
              >
                <Trash2 className="size-4" />
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
