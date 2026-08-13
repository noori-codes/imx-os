import type { CalendarView } from "@/types/calendar";

export function calendarHref(view: CalendarView, date: string) {
  return `/calendar?view=${view}&date=${date}`;
}
