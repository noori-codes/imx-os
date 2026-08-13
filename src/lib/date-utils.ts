export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toDateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateString(dateStr: string) {
  return startOfDay(new Date(`${dateStr}T00:00:00`));
}

export function getWeekDays(start: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return startOfDay(day);
  });
}

export function formatShortWeekday(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export function formatShortDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function isSameDay(a: Date, b: Date) {
  return toDateString(a) === toDateString(b);
}

export function isToday(dateStr: string) {
  return isSameDay(parseDateString(dateStr), startOfDay(new Date()));
}

export function isOverdue(dateStr: string) {
  const due = parseDateString(dateStr);
  const today = startOfDay(new Date());
  return due < today;
}

export function isDueThisWeek(dateStr: string) {
  const due = parseDateString(dateStr);
  const today = startOfDay(new Date());
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 6);
  return due >= today && due <= weekEnd;
}

/** Last N calendar days ending today (oldest → newest). */
export function getPastDays(count: number, from = new Date()) {
  const end = startOfDay(from);
  return Array.from({ length: count }, (_, i) => {
    const day = new Date(end);
    day.setDate(end.getDate() - (count - 1 - i));
    return startOfDay(day);
  });
}

export function daysBetween(a: string, b: string) {
  const ms = parseDateString(b).getTime() - parseDateString(a).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/** Streaks from a set of completed date strings (YYYY-MM-DD). */
export function computeStreaks(completedDates: string[], today = toDateString(new Date())) {
  const set = new Set(completedDates);
  const sorted = [...set].sort();

  let longest = 0;
  let run = 0;
  let prev: string | null = null;

  for (const date of sorted) {
    if (prev && daysBetween(prev, date) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = date;
  }

  let current = 0;
  if (set.has(today)) {
    current = 1;
    let cursor = parseDateString(today);
    cursor.setDate(cursor.getDate() - 1);
    while (set.has(toDateString(cursor))) {
      current += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
  } else {
    // Streak still alive if yesterday was completed
    const yesterday = parseDateString(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toDateString(yesterday);
    if (set.has(yesterdayStr)) {
      current = 1;
      let cursor = yesterday;
      cursor.setDate(cursor.getDate() - 1);
      while (set.has(toDateString(cursor))) {
        current += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
    }
  }

  return { current_streak: current, longest_streak: longest };
}

export function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return startOfDay(next);
}

export function addMonths(date: Date, amount: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return startOfDay(next);
}

export function startOfMonth(date: Date) {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
}

/** Sunday-start week, matching typical US month calendars. */
export function startOfWeek(date: Date) {
  const d = startOfDay(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function formatMonthYear(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function formatWeekdayLong(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(time: string) {
  const [hoursRaw, minutes] = time.split(":");
  const hours = Number(hoursRaw);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes} ${suffix}`;
}

export type CalendarDay = {
  date: string;
  day: number;
  inCurrentMonth: boolean;
  isToday: boolean;
};

export function getMonthGrid(anchor: Date): CalendarDay[] {
  const monthStart = startOfMonth(anchor);
  const gridStart = startOfWeek(monthStart);
  const today = toDateString(new Date());
  const month = monthStart.getMonth();

  return Array.from({ length: 42 }, (_, i) => {
    const date = addDays(gridStart, i);
    const dateStr = toDateString(date);
    return {
      date: dateStr,
      day: date.getDate(),
      inCurrentMonth: date.getMonth() === month,
      isToday: dateStr === today,
    };
  });
}

export function getWeekGrid(anchor: Date): CalendarDay[] {
  const weekStart = startOfWeek(anchor);
  const today = toDateString(new Date());
  const month = startOfMonth(anchor).getMonth();

  return getWeekDays(weekStart).map((date) => {
    const dateStr = toDateString(date);
    return {
      date: dateStr,
      day: date.getDate(),
      inCurrentMonth: date.getMonth() === month,
      isToday: dateStr === today,
    };
  });
}
