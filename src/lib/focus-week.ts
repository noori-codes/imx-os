import {
  getWeekDays,
  isToday,
  parseDateString,
  startOfWeekSaturday,
  toDateString,
} from "@/lib/date-utils";
import {
  focusLevel,
  formatFocusMinutes,
  type FocusWeekDay,
} from "@/types/focus";

export const FOCUS_WEEK_MAX_LOOKBACK = 16;

export function buildFocusWeekDays(
  focusByDay: Record<string, number>,
  weekOffset: number,
  todayLiveMinutes?: number,
): FocusWeekDay[] {
  const anchor = new Date();
  anchor.setDate(anchor.getDate() + weekOffset * 7);
  const weekStart = startOfWeekSaturday(anchor);

  return getWeekDays(weekStart).map((day) => {
    const date = toDateString(day);
    const stored = focusByDay[date] ?? 0;
    const minutes =
      weekOffset === 0 && todayLiveMinutes != null && isToday(date)
        ? todayLiveMinutes
        : stored;
    return {
      date,
      minutes,
      level: focusLevel(minutes),
    };
  });
}

export function minFocusWeekOffset(focusByDay: Record<string, number>) {
  const dates = Object.keys(focusByDay);
  if (dates.length === 0) return 0;

  const earliest = dates.reduce((a, b) => (a < b ? a : b));
  const currentStart = startOfWeekSaturday(new Date());
  const earliestStart = startOfWeekSaturday(parseDateString(earliest));
  const diffWeeks = Math.floor(
    (currentStart.getTime() - earliestStart.getTime()) / (7 * 86_400_000),
  );
  return -Math.min(FOCUS_WEEK_MAX_LOOKBACK, Math.max(0, diffWeeks));
}

export function formatFocusWeekLabel(
  weekDays: FocusWeekDay[],
  weekOffset: number,
) {
  if (weekDays.length === 0) return "This week";
  if (weekOffset === 0) return "This week";

  const first = parseDateString(weekDays[0].date);
  const last = parseDateString(weekDays[weekDays.length - 1].date);
  const sameMonth = first.getMonth() === last.getMonth();
  const sameYear = first.getFullYear() === last.getFullYear();

  const startPart = first.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  const endPart = last.toLocaleDateString("en-US", {
    month: sameMonth ? undefined : "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  return `${startPart} – ${endPart}`;
}

export function focusWeekSummaryLabel(
  weekDays: { minutes: number }[],
  goalMinutes: number,
) {
  const total = weekDays.reduce((sum, day) => sum + day.minutes, 0);
  if (total <= 0) return "No focus logged this week";
  if (goalMinutes <= 0) return `${formatFocusMinutes(total)} focused`;

  const weekGoal = goalMinutes * 7;
  if (total >= weekGoal) {
    return `Goal sealed · ${formatFocusMinutes(total)}`;
  }
  return `${formatFocusMinutes(total)} · ${formatFocusMinutes(weekGoal - total)} short of goal`;
}
