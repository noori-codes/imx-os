"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { ChevronDown, Clock, Play, Trash2 } from "lucide-react";

import { deleteFocusSessions } from "@/actions/focus";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  buildPickupHint,
  canContinueLoggedSession,
  continueSubject,
} from "@/lib/focus-continue";
import { groupDaySessionsIntoThreads } from "@/lib/focus-threads";
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

function threadTimeRange(sessions: FocusSession[]) {
  const times = sessions
    .map((session) => new Date(session.started_at).getTime())
    .sort((a, b) => a - b);
  const first = times[0];
  const last = times[times.length - 1];
  if (first == null || last == null) return "";
  if (first === last) return formatTime(new Date(first).toISOString());
  return `${formatTime(new Date(first).toISOString())} – ${formatTime(new Date(last).toISOString())}`;
}

export function FocusSessionList({ sessions }: FocusSessionListProps) {
  const [, startTransition] = useTransition();
  const isRunning = useFocusTimer((s) => s.isRunning);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [optimisticSessions, removeOptimistic] = useOptimistic(
    sessions,
    (current: FocusSession[], ids: string[]) =>
      current.filter((s) => !ids.includes(s.id)),
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

  function handleDelete(sessionsToDelete: FocusSession[], event: React.MouseEvent) {
    event.stopPropagation();
    const count = sessionsToDelete.length;
    const label =
      count === 1
        ? `${FOCUS_PRESETS[sessionsToDelete[0].mode].label.toLowerCase()} session`
        : `${count} sessions in this thread`;
    if (!window.confirm(`Delete this ${label}?`)) {
      return;
    }
    const ids = sessionsToDelete.map((session) => session.id);
    startTransition(async () => {
      removeOptimistic(ids);
      await deleteFocusSessions(ids);
    });
  }

  function handleContinue(threadSessions: FocusSession[]) {
    const latest = threadSessions[0];
    if (!latest || !canContinueLoggedSession(latest, isRunning)) return;
    useFocusTimer
      .getState()
      .continueFromLoggedSession(latest, threadSessions.slice(1));
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
        {groups.map((group) => {
          const threads = groupDaySessionsIntoThreads(group.sessions);
          return (
            <div key={group.key}>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {group.label}
                </h3>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {threads.length}
                </span>
              </div>

              <ul className="space-y-1">
                {threads.map((thread) => {
                  const latest = thread.sessions[0];
                  const isThread = thread.sessions.length > 1;
                  const open = expanded[thread.key] === true;
                  const canContinue = canContinueLoggedSession(
                    latest,
                    isRunning,
                  );
                  const subject = continueSubject(
                    latest.note,
                    latest.task_title,
                  );
                  const pickupHint = canContinue
                    ? buildPickupHint(thread.totalSeconds, subject)
                    : null;

                  return (
                    <li key={thread.key}>
                      <div
                        role={canContinue ? "button" : undefined}
                        tabIndex={canContinue ? 0 : undefined}
                        onClick={
                          canContinue
                            ? () => handleContinue(thread.sessions)
                            : undefined
                        }
                        onKeyDown={
                          canContinue
                            ? (event) => {
                                if (
                                  event.key === "Enter" ||
                                  event.key === " "
                                ) {
                                  event.preventDefault();
                                  handleContinue(thread.sessions);
                                }
                              }
                            : undefined
                        }
                        className={cn(
                          "group rounded-2xl px-2.5 py-2.5 transition-colors",
                          canContinue &&
                            "cursor-pointer hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          !canContinue && "hover:bg-muted/20",
                        )}
                        aria-label={
                          canContinue
                            ? `Continue session · ${pickupHint ?? formatFocusDuration(thread.totalSeconds)}`
                            : undefined
                        }
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "size-2 shrink-0 rounded-full",
                              modeTone(latest.mode),
                            )}
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {isThread
                                ? thread.title
                                : FOCUS_PRESETS[latest.mode].label}
                              {!latest.completed && !isThread ? (
                                <span className="ml-2 text-xs font-normal text-muted-foreground">
                                  stopped early
                                </span>
                              ) : null}
                            </p>
                            {pickupHint ? (
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {pickupHint}
                              </p>
                            ) : isThread ? (
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {thread.sessions.length} blocks ·{" "}
                                {threadTimeRange(thread.sessions)}
                              </p>
                            ) : latest.note ? (
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {latest.note}
                              </p>
                            ) : null}
                            {!isThread && latest.task_title ? (
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                Task{" "}
                                <Link
                                  href="/tasks"
                                  className="text-foreground/80 underline-offset-2 hover:underline"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  {latest.task_title}
                                </Link>
                              </p>
                            ) : null}
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="focus-clock text-sm text-foreground">
                              {formatFocusDuration(thread.totalSeconds)}
                            </p>
                            <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                              {isThread
                                ? `${thread.sessions.length} blocks`
                                : formatTime(latest.started_at)}
                            </p>
                          </div>
                          {isThread ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 shrink-0 text-muted-foreground"
                              onClick={(event) => {
                                event.stopPropagation();
                                setExpanded((current) => ({
                                  ...current,
                                  [thread.key]: !open,
                                }));
                              }}
                              aria-expanded={open}
                              aria-label={
                                open ? "Hide blocks" : "Show blocks"
                              }
                            >
                              <ChevronDown
                                className={cn(
                                  "size-3.5 transition-transform",
                                  open && "rotate-180",
                                )}
                              />
                            </Button>
                          ) : null}
                          {canContinue ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 shrink-0 text-foreground"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleContinue(thread.sessions);
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
                            onClick={(event) =>
                              handleDelete(thread.sessions, event)
                            }
                            aria-label={
                              isThread ? "Delete thread" : "Delete session"
                            }
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>

                        {isThread && open ? (
                          <ul className="mt-2 space-y-1 border-l border-border/50 pl-4">
                            {thread.sessions.map((session) => (
                              <li
                                key={session.id}
                                className="flex items-center justify-between gap-3 py-1 text-xs text-muted-foreground"
                              >
                                <span className="truncate">
                                  {formatTime(session.started_at)}
                                  {session.note &&
                                  session.note !== thread.title
                                    ? ` · ${session.note}`
                                    : ""}
                                </span>
                                <span className="focus-clock shrink-0 tabular-nums">
                                  {formatFocusDuration(session.actual_seconds)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
