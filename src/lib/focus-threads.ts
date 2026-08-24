import { continueSubject } from "@/lib/focus-continue";
import { toDateString } from "@/lib/date-utils";
import type { FocusSession } from "@/types/focus";

export type FocusThread = {
  key: string;
  title: string;
  sessions: FocusSession[];
  totalSeconds: number;
};

export function normalizeFocusNote(note: string | null | undefined) {
  return note?.trim().replace(/\s+/g, " ").toLowerCase() ?? "";
}

export function focusThreadKey(
  session: Pick<
    FocusSession,
    "mode" | "started_at" | "task_id" | "note" | "id"
  >,
) {
  const day = toDateString(new Date(session.started_at));
  if (session.mode !== "focus") return `${day}:solo:${session.id}`;

  if (session.task_id) return `${day}:task:${session.task_id}`;

  const note = normalizeFocusNote(session.note);
  if (note) return `${day}:note:${note}`;

  return `${day}:solo:${session.id}`;
}

export function sameFocusThread(
  a: Pick<FocusSession, "mode" | "started_at" | "task_id" | "note" | "id">,
  b: Pick<FocusSession, "mode" | "started_at" | "task_id" | "note" | "id">,
) {
  return focusThreadKey(a) === focusThreadKey(b);
}

export function threadTitle(sessions: FocusSession[]) {
  const latest = sessions[0];
  if (!latest) return "Focus";
  return (
    continueSubject(latest.note, latest.task_title) ??
    "Focus"
  );
}

export function groupDaySessionsIntoThreads(sessions: FocusSession[]) {
  const threads: FocusThread[] = [];
  const indexByKey = new Map<string, number>();

  for (const session of sessions) {
    const key = focusThreadKey(session);
    const existing = indexByKey.get(key);
    if (existing !== undefined) {
      threads[existing].sessions.push(session);
      threads[existing].totalSeconds += session.actual_seconds;
      continue;
    }
    indexByKey.set(key, threads.length);
    threads.push({
      key,
      title: threadTitle([session]),
      sessions: [session],
      totalSeconds: session.actual_seconds,
    });
  }

  for (const thread of threads) {
    thread.sessions.sort(
      (a, b) =>
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
    );
    thread.title = threadTitle(thread.sessions);
  }

  return threads;
}
