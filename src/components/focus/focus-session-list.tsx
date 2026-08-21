"use client";

import { useOptimistic, useTransition } from "react";
import { Clock, Trash2 } from "lucide-react";

import { deleteFocusSession } from "@/actions/focus";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatFocusDuration,
  FOCUS_PRESETS,
  type FocusSession,
} from "@/types/focus";

type FocusSessionListProps = {
  sessions: FocusSession[];
};

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - target.getTime()) / 86400000);

  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function groupSessions(sessions: FocusSession[]) {
  const groups: { key: string; label: string; sessions: FocusSession[] }[] = [];
  for (const session of sessions) {
    const key = dayKey(session.started_at);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.sessions.push(session);
    } else {
      groups.push({
        key,
        label: dayLabel(session.started_at),
        sessions: [session],
      });
    }
  }
  return groups;
}

function modeDot(mode: FocusSession["mode"]) {
  if (mode === "focus") return "bg-violet-500/80";
  if (mode === "short_break") return "bg-teal-500/80";
  return "bg-sky-500/80";
}

export function FocusSessionList({ sessions }: FocusSessionListProps) {
  const [, startTransition] = useTransition();
  const [optimisticSessions, removeOptimistic] = useOptimistic(
    sessions,
    (current: FocusSession[], id: string) =>
      current.filter((s) => s.id !== id),
  );

  if (optimisticSessions.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No sessions yet"
        description="Start the timer. Finished and stopped sessions will land here."
      />
    );
  }

  const groups = groupSessions(optimisticSessions);

  function handleDelete(session: FocusSession) {
    if (
      !window.confirm(
        `Delete this ${FOCUS_PRESETS[session.mode].label.toLowerCase()} session?`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      removeOptimistic(session.id);
      await deleteFocusSession(session.id);
    });
  }

  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">
        Recent{" "}
        <span className="tabular-nums text-foreground">
          {optimisticSessions.length}
        </span>
      </p>
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.key}>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h2>
              <span className="text-xs tabular-nums text-muted-foreground">
                {group.sessions.length}
              </span>
            </div>
            <ul className="border-t border-border/60">
              {group.sessions.map((session) => (
                <li
                  key={session.id}
                  className="group flex items-center gap-3 border-b border-border/50 py-3.5"
                >
                  <span
                    className={cn(
                      "size-2.5 shrink-0 rounded-full",
                      modeDot(session.mode),
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {FOCUS_PRESETS[session.mode].label}
                      {!session.completed ? (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          stopped early
                        </span>
                      ) : null}
                    </p>
                    {session.note ? (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {session.note}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatFocusDuration(session.actual_seconds)}
                    <span className="mx-1.5 text-border">·</span>
                    {formatTime(session.started_at)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground opacity-100 hover:text-destructive sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                    onClick={() => handleDelete(session)}
                    aria-label="Delete session"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
