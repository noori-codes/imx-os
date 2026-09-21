import { isOverdue, startOfDay, toDateString } from "@/lib/date-utils";
import type { TaskWithContext } from "@/types/dashboard";

export type SmartReason = "overdue" | "today" | "focus" | "next";

export type SmartTodayItem = {
  task: TaskWithContext;
  reason: SmartReason;
};

const SMART_CAP = 5;

function focusTaskIdFromHref(href: string | null | undefined) {
  if (!href) return null;
  try {
    const url = new URL(href, "https://imx.local");
    return url.searchParams.get("task");
  } catch {
    const match = href.match(/[?&]task=([^&]+)/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }
}

/** Rank open tasks for Smart Today: overdue → due today → focus-linked → rest. */
export function rankSmartToday(
  todayTasks: TaskWithContext[],
  overdueTasks: TaskWithContext[] = [],
  continueHref?: string | null,
): SmartTodayItem[] {
  const today = toDateString(startOfDay(new Date()));
  const focusId = focusTaskIdFromHref(continueHref ?? null);
  const seen = new Set<string>();
  const ranked: SmartTodayItem[] = [];

  function push(task: TaskWithContext, reason: SmartReason) {
    if (task.completed || seen.has(task.id)) return;
    seen.add(task.id);
    ranked.push({ task, reason });
  }

  for (const task of overdueTasks) {
    if (!task.completed && task.due_date && isOverdue(task.due_date)) {
      push(task, "overdue");
    }
  }

  for (const task of todayTasks) {
    if (task.completed) continue;
    if (task.due_date && isOverdue(task.due_date)) {
      push(task, "overdue");
    } else if (focusId && task.id === focusId) {
      push(task, "focus");
    } else if (task.due_date === today) {
      push(task, "today");
    } else {
      push(task, "next");
    }
  }

  // Focus-linked task might only appear in overdue list
  if (focusId) {
    const fromOverdue = overdueTasks.find((t) => t.id === focusId);
    if (fromOverdue) push(fromOverdue, "focus");
  }

  // Re-order: overdue, focus, today, next — stable within buckets
  const order: SmartReason[] = ["overdue", "focus", "today", "next"];
  ranked.sort(
    (a, b) => order.indexOf(a.reason) - order.indexOf(b.reason),
  );

  return ranked.slice(0, SMART_CAP);
}

export function smartReasonLabel(reason: SmartReason) {
  if (reason === "overdue") return "Overdue";
  if (reason === "focus") return "Focus";
  if (reason === "today") return "Due today";
  return "Up next";
}
