import { addDays, startOfDay, toDateString } from "@/lib/date-utils";
import type { TaskRecurrence } from "@/types/task";

export function parseTaskRecurrence(
  value: FormDataEntryValue | string | null | undefined,
): TaskRecurrence {
  if (value === "daily" || value === "weekdays") return value;
  return null;
}

/** First weekday on or after the given day (Mon–Fri). */
export function weekdayOnOrAfter(date = new Date()): string {
  let d = startOfDay(date);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d = addDays(d, 1);
  }
  return toDateString(d);
}

/**
 * Next occurrence strictly after `after` (defaults to today).
 * Daily → tomorrow; weekdays → next Mon–Fri after today.
 */
export function nextRecurrenceDueDate(
  recurrence: Exclude<TaskRecurrence, null>,
  after = new Date(),
): string {
  let d = addDays(startOfDay(after), 1);
  if (recurrence === "daily") return toDateString(d);

  while (d.getDay() === 0 || d.getDay() === 6) {
    d = addDays(d, 1);
  }
  return toDateString(d);
}

export function initialDueForRecurrence(
  recurrence: TaskRecurrence,
  dueDate: string | null,
): string | null {
  if (dueDate) return dueDate;
  if (recurrence === "daily") return toDateString(startOfDay(new Date()));
  if (recurrence === "weekdays") return weekdayOnOrAfter(new Date());
  return null;
}

export function recurrenceLabel(recurrence: TaskRecurrence): string | null {
  if (recurrence === "daily") return "Everyday";
  if (recurrence === "weekdays") return "Weekdays";
  return null;
}

/**
 * After a completed recurring day has passed, reopen for the next due date.
 * Keeps habit-like "done today" feedback until tomorrow.
 */
export function shouldResetRecurringTask(task: {
  recurrence: TaskRecurrence;
  completed: boolean;
  due_date: string | null;
}, today = toDateString(startOfDay(new Date()))): boolean {
  if (!task.recurrence || !task.completed || !task.due_date) return false;
  return task.due_date < today;
}

export function resetDueForRecurrence(
  recurrence: Exclude<TaskRecurrence, null>,
  today = new Date(),
): string {
  return initialDueForRecurrence(recurrence, null) ?? toDateString(startOfDay(today));
}
