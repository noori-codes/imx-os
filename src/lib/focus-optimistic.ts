import { useFocusTimer } from "@/stores/focus-timer";
import type { FocusSession, FocusTodayMark } from "@/types/focus";

function sessionsMatchOptimistic(
  session: FocusSession,
  optimistic: FocusSession,
) {
  if (optimistic.id && !optimistic.id.startsWith("optimistic-")) {
    return session.id === optimistic.id;
  }
  return (
    session.mode === optimistic.mode &&
    Math.abs(
      new Date(session.started_at).getTime() -
        new Date(optimistic.started_at).getTime(),
    ) < 15_000 &&
    Math.abs(session.actual_seconds - optimistic.actual_seconds) < 30
  );
}

/** Merge server sessions with any pending optimistic rows (newest first). */
export function mergeOptimisticSessions(
  sessions: FocusSession[],
  optimisticLogs: FocusSession[],
): FocusSession[] {
  if (optimisticLogs.length === 0) return sessions;

  let merged = [...sessions];
  const prepend: FocusSession[] = [];

  for (const optimistic of optimisticLogs) {
    const existingIndex = merged.findIndex(
      (session) => session.id === optimistic.id,
    );
    if (existingIndex >= 0) {
      merged[existingIndex] = {
        ...merged[existingIndex],
        ...optimistic,
        id: merged[existingIndex].id,
      };
      continue;
    }

    const duplicate = merged.some((session) =>
      sessionsMatchOptimistic(session, optimistic),
    );
    if (!duplicate) {
      prepend.push(optimistic);
    }
  }

  return [...prepend, ...merged];
}

/** Apply optimistic UI immediately when a session is logged (before server refresh). */
export function commitFocusSessionOptimistic(
  session: FocusSession,
  sealSeconds = session.actual_seconds,
) {
  const store = useFocusTimer.getState();
  store.pushOptimisticLog(session);
  if (session.mode === "focus" && sealSeconds > 0) {
    store.pulseSeal({
      startedAt: session.started_at,
      seconds: sealSeconds,
    });
  }
}

export function rollbackFocusSessionOptimistic() {
  const store = useFocusTimer.getState();
  store.clearOptimisticLogs();
  store.clearSealPulse();
}

export function sealPulseToTodayMark(
  seal: { startedAt: string; seconds: number },
  taskId: string | null = null,
  note: string | null = null,
): FocusTodayMark {
  return {
    id: `optimistic-seal-${seal.startedAt}`,
    started_at: seal.startedAt,
    minutes: Math.max(1, Math.round(seal.seconds / 60)),
    task_id: taskId,
    note,
  };
}

export function mergeTodayMarks(
  marks: FocusTodayMark[],
  sealPulse: { startedAt: string; seconds: number } | null,
  alreadyInStats: boolean,
  taskId: string | null = null,
  note: string | null = null,
): FocusTodayMark[] {
  if (!sealPulse || alreadyInStats) return marks;
  const optimistic = sealPulseToTodayMark(sealPulse, taskId, note);
  if (marks.some((mark) => mark.id === optimistic.id)) return marks;
  return [...marks, optimistic];
}

export function isOptimisticSessionId(id: string) {
  return id.startsWith("optimistic-");
}
