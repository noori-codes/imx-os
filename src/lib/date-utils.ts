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
