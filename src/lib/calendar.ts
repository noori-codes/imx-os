import { formatTime, toDateString } from "@/lib/date-utils";
import type {
  CalendarData,
  CalendarEvent,
  CalendarView,
} from "@/types/calendar";

export function calendarHref(
  view: CalendarView,
  date: string,
  options?: { compose?: boolean },
) {
  const params = new URLSearchParams({ view, date });
  if (options?.compose) params.set("compose", "1");
  return `/calendar?${params.toString()}`;
}

/** Sort key: all-day (null) first, then by HH:MM. */
export function eventTimeSortKey(time: string | null | undefined) {
  if (!time) return "";
  return time.slice(0, 5);
}

export function compareEventsByTime(a: CalendarEvent, b: CalendarEvent) {
  const ak = eventTimeSortKey(a.start_time);
  const bk = eventTimeSortKey(b.start_time);
  if (ak !== bk) return ak < bk ? -1 : 1;
  return a.title.localeCompare(b.title);
}

export function formatEventWhen(event: Pick<CalendarEvent, "start_time" | "end_time">) {
  if (!event.start_time) return "All day";
  const start = formatTime(event.start_time);
  if (event.end_time) {
    return `${start} – ${formatTime(event.end_time)}`;
  }
  return start;
}

export function formatEventTimeShort(
  event: Pick<CalendarEvent, "start_time" | "end_time">,
) {
  if (!event.start_time) return "All day";
  const start = event.start_time.slice(0, 5);
  const [hRaw, m] = start.split(":");
  const h = Number(hRaw);
  const hour12 = h % 12 || 12;
  const suffix = h >= 12 ? "p" : "a";
  const compact = m === "00" ? `${hour12}${suffix}` : `${hour12}:${m}${suffix}`;
  if (event.end_time) {
    const end = event.end_time.slice(0, 5);
    const [ehRaw, em] = end.split(":");
    const eh = Number(ehRaw);
    const eHour12 = eh % 12 || 12;
    const eSuffix = eh >= 12 ? "p" : "a";
    const eCompact =
      em === "00" ? `${eHour12}${eSuffix}` : `${eHour12}:${em}${eSuffix}`;
    return `${compact}–${eCompact}`;
  }
  return compact;
}

export type CalendarNextUp = {
  kind: "event" | "task";
  title: string;
  date: string;
  href: string;
  when: string;
};

/** Soonest upcoming timed event, else next open due task, from today forward in view. */
export function findCalendarNextUp(
  data: CalendarData,
  inViewDates: string[],
  view: CalendarView,
  selectedDate: string,
): CalendarNextUp | null {
  const today = toDateString(new Date());
  const nowMinutes = (() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  })();

  function minutesOf(time: string) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }

  const forward = inViewDates.filter((d) => d >= today).sort();

  for (const day of forward) {
    const items = data.days[day];
    if (!items) continue;
    const timed = [...items.events]
      .filter((e) => e.start_time)
      .sort(compareEventsByTime);

    for (const event of timed) {
      const mins = minutesOf(event.start_time!);
      if (day === today && mins < nowMinutes) continue;
      return {
        kind: "event",
        title: event.title,
        date: day,
        href: `${calendarHref(view, day)}#event-${event.id}`,
        when: day === today ? formatEventWhen(event) : `${day.slice(5)} · ${formatEventWhen(event)}`,
      };
    }
  }

  for (const day of forward) {
    const items = data.days[day];
    if (!items) continue;
    const open = items.tasks.find((t) => !t.completed);
    if (!open) continue;
    return {
      kind: "task",
      title: open.title,
      date: day,
      href: calendarHref(view, day === selectedDate ? selectedDate : day),
      when: day === today ? "Due today" : `Due ${day.slice(5)}`,
    };
  }

  return null;
}
