"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { Clock, Play, Trash2 } from "lucide-react";

import { deleteFocusSession } from "@/actions/focus";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  buildPickupHint,
  canContinueLoggedSession,
  continueSubject,
} from "@/lib/focus-continue";
import { cn } from "@/lib/utils";
import { useFocusTimer } from "@/stores/focus-timer";
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

function modeTone(mode: FocusSession["mode"]) {
  if (mode === "focus") return "bg-foreground/80";
  if (mode === "short_break") return "bg-amber-600/70 dark:bg-amber-400/70";
  return "bg-emerald-700/60 dark:bg-emerald-400/60";
}

function scrollToTimer() {
  document
    .getElementById("focus-timer")
    ?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function FocusSessionList({ sessions }: FocusSessionListProps) {
  const [, startTransition] = useTransition();
  const isRunning = useFocusTimer((s) => s.isRunning);
  const [optimisticSessions, removeOptimistic] = useOptimistic(
    sessions,
    (current: FocusSession[], id: string) =>
      current.filter((s) => s.id !== id),
  );

  if (optimisticSessions.length === 0) {
    return (
      <section>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Recent sessions
        </p>
        <EmptyState
          icon={Clock}
          title="No sessions yet"
          description="Start the timer. Finished and stopped sessions will land here."
          className="py-10"
        />
      </section>
    );
  }

  const groups = groupSessions(optimisticSessions);

  function handleDelete(session: FocusSession, event: React.MouseEvent) {
    event.stopPropagation();
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

  function handleContinue(session: FocusSession) {
    if (!canContinueLoggedSession(session, isRunning)) return;
    useFocusTimer.getState().continueFromLoggedSession(session);
    scrollToTimer();
  }

  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Recent sessions
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {optimisticSessions.length} logged
          </p>
        </div>
      </div>

      <div className="space-y-7">
        {groups.map((group) => (
          <div key={group.key}>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {group.label}
              </h3>
              <span className="text-xs tabular-nums text-muted-foreground">
                {group.sessions.length}
              </span>
            </div>

            <ul className="space-y-1">
              {group.sessions.map((session) => {
                const canContinue = canContinueLoggedSession(session, isRunning);
                const subject = continueSubject(
                  session.note,
                  session.task_title,
                );
                const pickupHint = canContinue
                  ? buildPickupHint(session.actual_seconds, subject)
                  : null;

                return (
                  <li key={session.id}>
                    <div
                      role={canContinue ? "button" : undefined}
                      tabIndex={canContinue ? 0 : undefined}
                      onClick={
                        canContinue ? () => handleContinue(session) : undefined
                      }
                      onKeyDown={
                        canContinue
                          ? (event) => {
                              if (
                                event.key === "Enter" ||
                                event.key === " "
                              ) {
                                event.preventDefault();
                                handleContinue(session);
                              }
                            }
                          : undefined
                      }
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl px-2.5 py-2.5 transition-colors",
                        canContinue &&
                          "cursor-pointer hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        !canContinue && "hover:bg-muted/20",
                      )}
                      aria-label={
                        canContinue
                          ? `Continue session · ${pickupHint ?? formatFocusDuration(session.actual_seconds)}`
                          : undefined
                      }
                    >
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          modeTone(session.mode),
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
                        {pickupHint ? (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {pickupHint}
                          </p>
                        ) : session.note ? (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {session.note}
                          </p>
                        ) : null}
                        {session.task_title ? (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            Task{" "}
                            <Link
                              href="/tasks"
                              className="text-foreground/80 underline-offset-2 hover:underline"
                              onClick={(event) => event.stopPropagation()}
                            >
                              {session.task_title}
                            </Link>
                          </p>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="focus-clock text-sm text-foreground">
                          {formatFocusDuration(session.actual_seconds)}
                        </p>
                        <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                          {formatTime(session.started_at)}
                        </p>
                      </div>
                      {canContinue ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0 text-foreground"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleContinue(session);
                          }}
                          aria-label="Continue session"
                        >
                          <Play className="size-3.5 fill-current" />
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-muted-foreground opacity-100 hover:text-destructive sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                        onClick={(event) => handleDelete(session, event)}
                        aria-label="Delete session"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
