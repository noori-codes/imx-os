import type { Note } from "@/types/note";
import type { Task } from "@/types/task";

export type CalendarView = "month" | "week";

export type CalendarEvent = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  created_at: string;
  updated_at: string;
};

export type CalendarTask = Task & {
  context: string | null;
  context_href: string | null;
};

export type CalendarItemKind = "event" | "task" | "journal";

export type CalendarDayItems = {
  date: string;
  events: CalendarEvent[];
  tasks: CalendarTask[];
  journals: Note[];
};

export type CalendarData = {
  rangeStart: string;
  rangeEnd: string;
  days: Record<string, CalendarDayItems>;
};
