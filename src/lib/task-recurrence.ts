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
